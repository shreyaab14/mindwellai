import { useRef, useEffect, useState } from "react";
import { type ChatMessage } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { EmotionIndicator } from "./EmotionIndicator";
import { Loader2, Volume2, VolumeX, Copy, Check } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

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
      // Stop speaking
      speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    // Use a calm, therapeutic voice if available
    const voices = speechSynthesis.getVoices();
    const therapeuticVoice = voices.find(voice =>
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('calm') ||
      voice.name.toLowerCase().includes('soft')
    );
    if (therapeuticVoice) {
      utterance.voice = therapeuticVoice;
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

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-heading font-semibold">Therapy Session</h2>
        <p className="text-sm text-muted-foreground">AI-powered supportive conversation</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && streamingContent === "" ? (
            <div className="flex items-center justify-center h-full py-12">
              <p className="text-muted-foreground text-center max-w-md">
                Your therapy session will begin once we detect your emotions. The AI therapist will provide supportive guidance based on your current emotional state.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${message.role}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-6 py-4 group ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  }`}
                >
                  {message.emotion && message.emotionConfidence && (
                    <div className="mb-2">
                      <EmotionIndicator
                        emotion={message.emotion}
                        confidence={message.emotionConfidence}
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base leading-relaxed whitespace-pre-wrap flex-1">{message.content}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      {message.role === "assistant" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTextToSpeech(message)}
                            className="h-6 w-6 p-0 shrink-0"
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
                            className="h-6 w-6 p-0 shrink-0"
                            title="Copy message"
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-60 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-card border rounded-3xl px-6 py-4">
                    <div className="flex items-start gap-3">
                      <p className="text-base leading-relaxed whitespace-pre-wrap flex-1">{streamingContent}</p>
                      <Loader2 className="h-4 w-4 animate-spin mt-1 ml-2 shrink-0" />
                    </div>
                  </div>
                </div>
              )}

              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-card border rounded-3xl px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Therapist is thinking...</span>
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
