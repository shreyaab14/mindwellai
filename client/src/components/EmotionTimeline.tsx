import { type EmotionDetection } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface EmotionTimelineProps {
  emotions: EmotionDetection[];
}

export function EmotionTimeline({ emotions }: EmotionTimelineProps) {
  const now = Date.now();
  const last60Seconds = emotions.filter(e => now - e.timestamp < 60000);
  
  const data = last60Seconds.map(e => ({
    time: Math.floor((now - e.timestamp) / 1000),
    confidence: e.confidence * 100,
    emotion: e.emotion,
  })).reverse();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-4">Emotion Timeline (Last 60s)</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data}>
            <XAxis 
              dataKey="time" 
              reversed
              label={{ value: 'Seconds ago', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]}
              label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-popover-border rounded-md p-2 text-xs">
                      <p>{payload[0].payload.emotion}</p>
                      <p>{Math.round(payload[0].value as number)}% confidence</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="confidence" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
          No emotion data yet
        </div>
      )}
    </Card>
  );
}
