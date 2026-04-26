const fs = require('fs');
const path = 'c:/Users/Shreya Bhise/Downloads/MindWellAI/MindWellAI/client/src/components/MessageInput.tsx';

const content = `import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Volume2, Brain, Waves, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeVoiceEmotion, recordAudio, type VoiceEmotionResult } from "@/lib/voiceAnalysis";

interface MessageInputProps {
  onSend: (message: string, voiceEmotion?: VoiceEmotionResult) => void;
  disabled?: boolean;
  showQuickReplies?: boolean;
}

const QUICK_REPLIES = [
  { label: "I feel anxious", emotion: "anxious", icon: "😰" },
  { label: "I am sad today", emotion: "sad", icon: "😢" },
  { label: "I feel stressed", emotion: "angry", icon: "😤" },
  { label: "I need to vent", emotion: "neutral", icon: "💭" },
  { label: "I feel okay", emotion: "happy", icon: "🙂" },
  { label: "I am overwhelmed", emotion: "anxious", icon: "😵" },
  { label: "I cannot sleep", emotion: "tired", icon: "😴" },
  { label: "I feel lonely", emotion: "sad", icon: "🥺" },
];

export function MessageInput({ onSend, disabled, showQuickReplies = true }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setMessage((prev) => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => setIsRecording(false);

      recognitionRef.current.onerror = (event) => {
        setIsRecording(false);
        if (event.error !== "no-speech") {
          toast({ title: "Voice error", description: event.error, variant: "destructive" });
        }
      };
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [toast]);

  const startAudioViz = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        setAudioData(Array.from(dataArray.slice(0, 20)).map((v) => v / 255));
      };
      draw();
      return () => {
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
      };
    } catch (e) {
      console.error(e);
    }
  };

  const handleVoiceInput = async () => {
    if (!recognitionRef.current) {
      toast({ title: "Not supported", description: "Browser does not support voice input", variant: "destructive" });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setAudioData([]);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
      startAudioViz();
    }
  };

  const handleVoiceEmotion = async () => {
    if (isAnalyzingVoice) return;
    setIsAnalyzingVoice(true);
    toast({ title: "Recording...", description: "Speak for 3 seconds" });
    try {
      const cleanup = await startAudioViz();
      const blob = await recordAudio(3000);
      if (cleanup) cleanup();
      const result = await analyzeVoiceEmotion(blob);
      setAudioData([]);
      toast({ title: "Detected: " + result.emotion, description: Math.round(result.confidence * 100) + "% confidence" });
      onSend(message.trim() || "I am feeling " + result.emotion, result);
      setMessage("");
    } catch (e) {
      toast({ title: "Analysis failed", description: "Could not analyze voice", variant: "destructive" });
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const handleTTS = () => {
    if (!message.trim()) {
      toast({ title: "Enter text first", variant: "destructive" });
      return;
    }
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(message);
      u.rate = 0.9; u.pitch = 1; u.volume = 0.8;
      speechSynthesis.speak(u);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickReply = (reply: (typeof QUICK_REPLIES)[0]) => {
    onSend(reply.label, { emotion: reply.emotion as any, confidence: 0.85, features: { pitch: 0, volume: 0, speed: 0, tone: 0 } });
  };

  return (
    <div className="border-t bg-card">
      {showQuickReplies && !disabled && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_REPLIES.map((reply) => (
              <Button key={reply.label} type="button" variant="secondary" size="sm" onClick={() => handleQuickReply(reply)} className="shrink-0 rounded-full text-xs px-3 py-1 h-8 hover:bg-primary/10 hover:text-primary transition-colors">
                <span className="mr-1">{reply.icon}</span>
                {reply.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isRecording && (
        <div className="px-4 py-2 flex items-center gap-2">
          <div className="flex items-end gap-[2px] h-8 flex-1">
            {audioData.map((level, i) => (
              <div key={i} className="flex-1 bg-primary rounded-full transition-all duration-75" style={{ height: \`\${Math.max(4, level * 100)}%\`, opacity: 0.3 + level * 0.7 }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">Listening...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Share how you are feeling..." disabled={disabled} className="resize-none min-h-[60px] text-base" data-testid="input-message" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Button type="button" size="icon" variant={isRecording ? "destructive" : "outline"} onClick={handleVoiceInput} disabled={disabled} className="h-[28px] w-[50px]" title="Voice input">
              {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button type="button" size="icon" variant={isAnalyzingVoice ? "default" : "outline"} onClick={handleVoiceEmotion} disabled={disabled || isAnalyzingVoice} className="h-[28px] w-[50px]" title="Voice emotion analysis">
              {isAnalyzingVoice ? <Waves className="h-4 w-4 animate-pulse" /> : <Brain className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button type="button" size="icon" variant="outline" onClick={handleTTS} disabled={disabled || !message.trim()} className="h-[28px] w-[50px]" title="Text-to-speech">
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button type="submit" size="icon" disabled={disabled || !message.trim()} className="h-[28px] w-[50px]" data-testid="button-send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
`;

fs.writeFileSync(path, content, 'utf8');
console.log('File written successfully');

