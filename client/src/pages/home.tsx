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
import { CrisisAlert } from "@/components/CrisisAlert";
import { Play, Square, Loader2, History, TrendingUp, Heart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loadModels, detectEmotion } from "@/lib/emotionDetection";
import { Link } from "wouter";

export default function Home() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionDetection | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionDetection[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [webcamError, setWebcamError] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  const detectCrisis = (messageText: string): boolean => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
      'self harm', 'hurt myself', 'cutting', 'overdose', 'no reason to live',
      'can\'t go on', 'unbearable pain', 'hopeless', 'worthless'
    ];
    
    const lowerText = messageText.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
  };

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
      setStreamingContent("");

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/messages/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          content,
          emotion: emotion || null,
          emotionConfidence: emotionConfidence ? emotionConfidence.toString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let lastMessageId = "";
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          buffer += text;
          
          // Process complete lines only
          const parts = buffer.split('\n');
          buffer = parts.pop() || ""; // Keep incomplete line in buffer

          for (const line of parts) {
            if (line.trim().startsWith('data: ')) {
              const data = line.trim().slice(6).trim();
              if (data && data !== ':keep-alive') {
                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === 'chunk') {
                    fullContent += parsed.content;
                    setStreamingContent(fullContent);
                  } else if (parsed.type === 'complete') {
                    lastMessageId = parsed.messageId;
                    setStreamingContent("");
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.error || 'Stream error');
                  } else if (parsed.type === 'start') {
                    console.log("Stream started");
                  }
                } catch (e) {
                  console.debug("Parse error:", e);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return { messageId: lastMessageId, content: fullContent };
    },
    onSuccess: (data) => {
      if (data.content) {
        const assistantMessage: ChatMessage = {
          id: data.messageId || crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    },
    onError: (error) => {
      setStreamingContent("");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
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
    try {
      await loadModels();
      setIsModelLoading(false);
      startEmotionDetection();
      toast({
        title: "Emotion detection ready",
        description: "Face recognition models loaded successfully.",
      });
    } catch (error) {
      setIsModelLoading(false);
      setWebcamError("Failed to load emotion detection models.");
      toast({
        title: "Model Error",
        description: "Failed to load emotion detection. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const startEmotionDetection = () => {
    detectionIntervalRef.current = window.setInterval(() => {
      performEmotionDetection();
    }, 2000);
  };

  const performEmotionDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const result = await detectEmotion(videoRef.current, canvasRef.current);
      
      if (result) {
        const detection: EmotionDetection = {
          emotion: result.emotion,
          confidence: result.confidence,
          timestamp: Date.now(),
        };
        
        setCurrentEmotion(detection);
        setEmotionHistory(prev => [...prev, detection].slice(-30));
      }
    } catch (error) {
      console.error("Emotion detection error:", error);
    }
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

  const handleSendMessage = (content: string, voiceEmotion?: any) => {
    if (detectCrisis(content)) {
      setShowCrisisAlert(true);
    }
    
    // Use voice emotion if available, otherwise use current emotion detection
    const emotion = voiceEmotion?.emotion || currentEmotion?.emotion;
    const confidence = voiceEmotion ? voiceEmotion.confidence : currentEmotion?.confidence;
    
    sendMessageMutation.mutate({
      content,
      emotion,
      emotionConfidence: confidence,
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
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
                  
                  <div className="flex gap-3">
                    <Link href="/history" data-testid="link-history">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-2xl px-6 py-6 text-base h-auto"
                      >
                        <History className="mr-2 h-5 w-5" />
                        History
                      </Button>
                    </Link>
                    
                    <Link href="/analytics" data-testid="link-analytics">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-2xl px-6 py-6 text-base h-auto"
                      >
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
                
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

              <div className="mt-8 pt-8 border-t">
                <p className="text-center text-muted-foreground mb-4">
                  Explore additional resources
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/coping-strategies" data-testid="link-coping">
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4 mr-2" />
                      Coping Strategies
                    </Button>
                  </Link>
                  <Link href="/journal" data-testid="link-journal">
                    <Button variant="outline" size="sm">
                      📓 Journal
                    </Button>
                  </Link>
                  <Link href="/analytics" data-testid="link-analytics">
                    <Button variant="outline" size="sm">
                      📊 Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6 h-[calc(100vh-12rem)]">
            <div className="lg:col-span-2 space-y-4">
              {showCrisisAlert && (
                <CrisisAlert onDismiss={() => setShowCrisisAlert(false)} />
              )}
              
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
                  streamingContent={streamingContent}
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
