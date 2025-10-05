import { useRef, useEffect } from "react";
import { type ChatMessage } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmotionIndicator } from "./EmotionIndicator";
import { Loader2 } from "lucide-react";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatInterface({ messages, isLoading }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-heading font-semibold">Therapy Session</h2>
        <p className="text-sm text-muted-foreground">AI-powered supportive conversation</p>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full py-12">
              <p className="text-muted-foreground text-center max-w-md">
                Your therapy session will begin once we detect your emotions. The AI therapist will provide supportive guidance based on your current emotional state.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${message.role}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-6 py-4 ${
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
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border rounded-3xl px-6 py-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Therapist is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
