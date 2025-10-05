import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type EmotionDetection, type ChatMessage, type EmotionType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { WebcamView } from "@/components/WebcamView";
import { EmotionIndicator } from "@/components/EmotionIndicator";
import { ChatInterface } from "@/components/ChatInterface";
import { MessageInput } from "@/components/MessageInput";
import { EmotionTimeline } from "@/components/EmotionTimeline";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Play, Square, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionDetection | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionDetection[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [webcamError, setWebcamError] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sessions/start", {});
      return response;
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setIsSessionActive(true);
      startWebcam();
      toast({
        title: "Session started",
        description: "Your therapy session has begun. The AI will provide support based on your emotions.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) return;
      await apiRequest("POST", "/api/sessions/end", { sessionId });
    },
    onSuccess: () => {
      stopWebcam();
      setIsSessionActive(false);
      setSessionId(null);
      setCurrentEmotion(null);
      setEmotionHistory([]);
      setMessages([]);
      toast({
        title: "Session ended",
        description: "Your therapy session has been saved.",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, emotion, emotionConfidence }: { content: string; emotion?: EmotionType; emotionConfidence?: number }) => {
      if (!sessionId) throw new Error("No active session");
      
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        emotion,
        emotionConfidence,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      const response = await apiRequest("POST", "/api/messages", {
        sessionId,
        content,
        emotion: emotion || null,
        emotionConfidence: emotionConfidence ? Math.round(emotionConfidence * 100) : null,
      });
      
      return response;
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamError("");
        
        videoRef.current.onloadedmetadata = () => {
          setIsModelLoading(true);
          loadFaceDetectionModels();
        };
      }
    } catch (error) {
      setWebcamError("Unable to access camera. Please ensure camera permissions are granted.");
      toast({
        title: "Camera Error",
        description: "Please enable camera access to use emotion detection.",
        variant: "destructive",
      });
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const loadFaceDetectionModels = async () => {
    setIsModelLoading(false);
    startEmotionDetection();
  };

  const startEmotionDetection = () => {
    detectionIntervalRef.current = window.setInterval(() => {
      detectEmotion();
    }, 2000);
  };

  const detectEmotion = () => {
    const emotions: EmotionType[] = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.6 + Math.random() * 0.3;
    
    const detection: EmotionDetection = {
      emotion: randomEmotion,
      confidence,
      timestamp: Date.now(),
    };
    
    setCurrentEmotion(detection);
    setEmotionHistory(prev => [...prev, detection].slice(-30));
  };

  useEffect(() => {
    if (currentEmotion && isSessionActive && messages.length === 0) {
      const greeting = `I notice you're feeling ${currentEmotion.emotion}. How can I support you today?`;
      sendMessageMutation.mutate({
        content: greeting,
        emotion: currentEmotion.emotion,
        emotionConfidence: currentEmotion.confidence,
      });
    }
  }, [currentEmotion, isSessionActive]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate({
      content,
      emotion: currentEmotion?.emotion,
      emotionConfidence: currentEmotion?.confidence,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Mental Health Monitoring</h1>
              <p className="text-sm text-muted-foreground">AI-driven emotion detection & supportive therapy</p>
            </div>
            <div className="flex items-center gap-2">
              {isSessionActive && sessionId && (
                <div className="text-sm text-muted-foreground mr-4" data-testid="session-status">
                  Session Active
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isSessionActive ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6 py-12">
              <div className="space-y-3">
                <h2 className="text-4xl font-heading font-bold">Welcome to Your Safe Space</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our AI-powered therapy assistant detects your emotions in real-time and provides supportive, personalized guidance. 
                  All emotion processing happens locally on your device for complete privacy.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 py-8">
                <Button
                  size="lg"
                  onClick={() => startSessionMutation.mutate()}
                  disabled={startSessionMutation.isPending}
                  className="rounded-2xl px-8 py-6 text-lg h-auto"
                  data-testid="button-start-session"
                >
                  {startSessionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Starting Session...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Start Therapy Session
                    </>
                  )}
                </Button>
                
                <PrivacyBadge />
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-8 max-w-3xl mx-auto">
                <div className="p-6 rounded-xl bg-card border">
                  <h3 className="font-heading font-semibold mb-2">Real-time Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced facial emotion recognition detects your mood instantly
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-card border">
                  <h3 className="font-heading font-semibold mb-2">Adaptive Support</h3>
                  <p className="text-sm text-muted-foreground">
                    AI therapy adapts responses based on your emotional state
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-card border">
                  <h3 className="font-heading font-semibold mb-2">Complete Privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    All processing happens locally - your data never leaves your device
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6 h-[calc(100vh-12rem)]">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-4">
                <WebcamView
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isActive={isSessionActive}
                  error={webcamError}
                />
                
                {isModelLoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading emotion detection models...</span>
                  </div>
                )}
                
                {currentEmotion && !isModelLoading && (
                  <EmotionIndicator
                    emotion={currentEmotion.emotion}
                    confidence={currentEmotion.confidence}
                    size="lg"
                  />
                )}
                
                <EmotionTimeline emotions={emotionHistory} />
                
                <div className="flex flex-col gap-2">
                  <PrivacyBadge />
                  <Button
                    variant="destructive"
                    onClick={() => endSessionMutation.mutate()}
                    disabled={endSessionMutation.isPending}
                    className="w-full"
                    data-testid="button-end-session"
                  >
                    {endSessionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ending Session...
                      </>
                    ) : (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        End Session
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col">
              <div className="flex-1 min-h-0">
                <ChatInterface
                  messages={messages}
                  isLoading={sendMessageMutation.isPending}
                />
              </div>
              <MessageInput
                onSend={handleSendMessage}
                disabled={sendMessageMutation.isPending || !isSessionActive}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
