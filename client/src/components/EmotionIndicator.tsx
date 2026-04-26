import { type EmotionType } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Smile, Frown, Angry, AlertTriangle, ThumbsDown, Zap, Minus } from "lucide-react";

interface EmotionIndicatorProps {
  emotion: EmotionType;
  confidence: number;
  size?: "sm" | "lg";
}

const emotionConfig: Record<EmotionType, { label: string; icon: any; color: string }> = {
  happy: { label: "Happy", icon: Smile, color: "bg-emotion-happy/20 text-emotion-happy border-emotion-happy/30" },
  sad: { label: "Sad", icon: Frown, color: "bg-emotion-sad/20 text-emotion-sad border-emotion-sad/30" },
  angry: { label: "Angry", icon: Angry, color: "bg-emotion-angry/20 text-emotion-angry border-emotion-angry/30" },
  fearful: { label: "Fearful", icon: AlertTriangle, color: "bg-emotion-fearful/20 text-emotion-fearful border-emotion-fearful/30" },
  disgusted: { label: "Disgusted", icon: ThumbsDown, color: "bg-emotion-disgusted/20 text-emotion-disgusted border-emotion-disgusted/30" },
  surprised: { label: "Surprised", icon: Zap, color: "bg-emotion-surprised/20 text-emotion-surprised border-emotion-surprised/30" },
  neutral: { label: "Neutral", icon: Minus, color: "bg-emotion-neutral/20 text-emotion-neutral border-emotion-neutral/30" },
};

export function EmotionIndicator({ emotion, confidence, size = "sm" }: EmotionIndicatorProps) {
  const config = emotionConfig[emotion] || emotionConfig.neutral;
  const Icon = config.icon;

  if (size === "lg") {
    return (
      <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 ${config.color}`} data-testid={`emotion-indicator-${emotion}`}>
        <Icon className="h-16 w-16 mb-4" />
        <h3 className="text-2xl font-heading font-semibold mb-2">{config.label}</h3>
        <div className="text-lg font-medium" data-testid="emotion-confidence">
          {Math.round(confidence * 100)}% Confidence
        </div>
      </div>
    );
  }

  return (
    <Badge variant="outline" className={`${config.color} gap-2`} data-testid={`emotion-badge-${emotion}`}>
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
      <span className="text-xs opacity-70">{Math.round(confidence * 100)}%</span>
    </Badge>
  );
}
