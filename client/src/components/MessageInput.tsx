import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, MicOff, Volume2, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeVoiceEmotion, recordAudio, type VoiceEmotionResult } from "@/lib/voiceAnalysis";

interface MessageInputProps {
  onSend: (message: string, voiceEmotion?: VoiceEmotionResult) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak your message clearly",
        });
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setIsRecording(false);
        toast({
          title: "Voice recognition error",
          description: event.error,
          variant: "destructive",
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleTextToSpeech = () => {
    if (!message.trim()) {
      toast({
        title: "No text to speak",
        description: "Please enter a message first",
        variant: "destructive",
      });
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Use a female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'));
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Text-to-speech not supported",
        description: "Your browser doesn't support text-to-speech",
        variant: "destructive",
      });
    }
  };

  const handleVoiceEmotionAnalysis = async () => {
    if (isAnalyzingVoice) return;

    setIsAnalyzingVoice(true);
    toast({
      title: "Recording for emotion analysis...",
      description: "Please speak for 3 seconds",
    });

    try {
      const audioBlob = await recordAudio(3000);
      const voiceEmotion = await analyzeVoiceEmotion(audioBlob);

      toast({
        title: "Voice emotion detected",
        description: `Detected: ${voiceEmotion.emotion} (${Math.round(voiceEmotion.confidence * 100)}% confidence)`,
      });

      // Send message with voice emotion data
      if (message.trim()) {
        onSend(message.trim(), voiceEmotion);
        setMessage("");
      } else {
        // If no text message, create a message about the emotion
        onSend(`I'm feeling ${voiceEmotion.emotion}`, voiceEmotion);
      }
    } catch (error) {
      console.error('Voice emotion analysis error:', error);
      toast({
        title: "Voice analysis failed",
        description: "Could not analyze voice emotion",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingVoice(false);
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

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-card">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share how you're feeling or what's on your mind..."
          disabled={disabled}
          className="resize-none min-h-[60px] text-base"
          data-testid="input-message"
        />
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={handleVoiceInput}
            disabled={disabled}
            className="h-[29px] w-[60px]"
            title="Voice input"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant={isAnalyzingVoice ? "destructive" : "outline"}
            onClick={handleVoiceEmotionAnalysis}
            disabled={disabled || isAnalyzingVoice}
            className="h-[29px] w-[60px]"
            title="Voice emotion analysis"
          >
            <Brain className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleTextToSpeech}
            disabled={disabled || !message.trim()}
            className="h-[29px] w-[60px]"
            title="Text-to-speech"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !message.trim()}
            className="h-[29px] w-[60px]"
            data-testid="button-send"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </form>
  );
}
