import { useRef, useEffect, useState } from "react";
import { type ChatMessage } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { EmotionIndicator } from "./EmotionIndicator";
import { Loader2, Volume2, VolumeX, Copy, Check, ThumbsUp, Heart, Lightbulb, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  streamingContent?: string;
}

export function ChatInterface({ messages, isLoading, streamingContent = "" }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const { toast } = useToast();

  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Auto-play TTS for new assistant messages
  useEffect(() => {
    if (autoPlayEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && voicesLoaded) {
        // Small delay to let the message render first
        const timeout = setTimeout(() => {
          handleTextToSpeech(lastMessage);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [messages, autoPlayEnabled, voicesLoaded]);
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
        }
      };
      
      loadVoices();
      
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Fallback: try again after a short delay
      const timeout = setTimeout(loadVoices, 500);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleTextToSpeech = (message: ChatMessage) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Text-to-speech not supported",
        description: "Your browser doesn't support text-to-speech",
        variant: "destructive",
      });
      return;
    }

    if (speakingMessageId === message.id) {
      speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 0.85;

    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('google us english')
    ) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setSpeakingMessageId(message.id);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => {
      setSpeakingMessageId(null);
      toast({
        title: "Speech synthesis error",
        description: "Failed to speak the message",
        variant: "destructive",
      });
    };

    speechSynthesis.speak(utterance);
  };

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const handleReaction = (messageId: string, reaction: string) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: prev[messageId] === reaction ? '' : reaction
    }));
    toast({
      title: reaction === 'helpful' ? "Marked as helpful" : reaction === 'heart' ? "Loved it" : "Noted!",
      description: "Your feedback helps improve responses",
    });
  };

  const formatMessageTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const shouldShowDate = (currentMsg: ChatMessage, prevMsg: ChatMessage | undefined) => {
    if (!prevMsg) return true;
    const current = new Date(currentMsg.timestamp).toDateString();
    const prev = new Date(prevMsg.timestamp).toDateString();
    return current !== prev;
  };

  const formatDate = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const dateStr = date.toDateString();
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <Card className="flex flex-col h-full border-0 shadow-none bg-transparent">
      <div className="p-4 border-b bg-card/50 backdrop-blur rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-lg font-heading font-semibold">MindWell AI Therapist</h2>
          </div>
          <Button
            size="sm"
            variant={autoPlayEnabled ? "default" : "ghost"}
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            className="h-8 px-2 text-xs gap-1"
            title={autoPlayEnabled ? "Disable auto-read" : "Enable auto-read"}
          >
            {autoPlayEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            {autoPlayEnabled ? "Speaking" : "Read aloud"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Here to listen, support, and guide you</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && streamingContent === "" ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center max-w-md space-y-2">
                <p className="text-muted-foreground">
                  Welcome to your safe space. I am here to listen without judgment and support you through whatever you are feeling.
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Share what is on your mind, or use the voice features to express yourself.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={message.id}>
                  {shouldShowDate(message, messages[index - 1]) && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.role}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 group relative ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-card border shadow-sm mr-8"
                      }`}
                    >
                      {message.emotion && message.emotionConfidence && (
                        <div className="mb-2">
                          <EmotionIndicator
                            emotion={message.emotion}
                            confidence={message.emotionConfidence}
                            size="sm"
                          />
                        </div>
                      )}
                      <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</div>
                      
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReaction(message.id, 'helpful')}
                            className={`h-7 px-2 text-xs ${reactions[message.id] === 'helpful' ? 'text-green-600 bg-green-50' : ''}`}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Helpful
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReaction(message.id, 'heart')}
                            className={`h-7 px-2 text-xs ${reactions[message.id] === 'heart' ? 'text-red-500 bg-red-50' : ''}`}
                          >
                            <Heart className="h-3 w-3 mr-1" />
                            Thanks
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReaction(message.id, 'insight')}
                            className={`h-7 px-2 text-xs ${reactions[message.id] === 'insight' ? 'text-amber-600 bg-amber-50' : ''}`}
                          >
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Insight
                          </Button>
                          <div className="flex-1" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTextToSpeech(message)}
                            className="h-7 w-7 p-0"
                            title={speakingMessageId === message.id ? "Stop speaking" : "Speak message"}
                          >
                            {speakingMessageId === message.id ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className="h-7 w-7 p-0"
                            title="Copy message"
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                      
                      <p className={`text-[11px] mt-1.5 ${message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-card border shadow-sm rounded-2xl px-5 py-3.5 mr-8">
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{streamingContent}</div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-card border shadow-sm rounded-2xl px-5 py-3.5 mr-8">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">MindWell is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
