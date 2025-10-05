import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TherapyContext {
  emotion?: string;
  emotionConfidence?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function generateTherapyResponse(
  userMessage: string,
  context: TherapyContext
): Promise<string> {
  const confidenceNum = context.emotionConfidence ? parseFloat(context.emotionConfidence) : undefined;
  const systemPrompt = buildSystemPrompt(context.emotion, confidenceNum);
  
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...context.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    } as OpenAI.Chat.ChatCompletionMessageParam)),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 2048,
    });

    return response.choices[0].message.content || "I'm here to listen. Please continue.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate therapy response");
  }
}

function buildSystemPrompt(emotion?: string, confidence?: number): string {
  let basePrompt = `You are a compassionate, empathetic AI therapy assistant designed to provide supportive mental health guidance. Your role is to:

1. Listen actively and validate the user's feelings
2. Provide emotional support and coping strategies
3. Ask thoughtful questions to help users explore their emotions
4. Offer practical mindfulness and stress-management techniques
5. Maintain a warm, non-judgmental, and encouraging tone
6. NEVER diagnose mental health conditions or replace professional therapy
7. Encourage seeking professional help for serious concerns

Guidelines:
- Keep responses concise and focused (2-4 sentences typically)
- Use empathetic language that shows understanding
- Avoid clinical jargon - be conversational and approachable
- Validate emotions before offering suggestions
- End with open-ended questions when appropriate to encourage dialogue`;

  if (emotion && confidence !== undefined) {
    const confidencePercent = Math.round(confidence * 100);
    basePrompt += `\n\nCurrent emotional context: The user appears to be feeling ${emotion} (${confidencePercent}% confidence). Adapt your response to acknowledge and support this emotional state appropriately.`;
    
    const emotionGuidance: Record<string, string> = {
      sad: "Show extra compassion and gentleness. Validate their sadness and explore what might help them feel supported.",
      angry: "Acknowledge their frustration calmly. Help them process anger constructively without dismissing their feelings.",
      fearful: "Provide reassurance and safety. Help them identify what feels threatening and develop coping strategies.",
      happy: "Share in their positive emotions. Explore what's going well and how they can build on positive experiences.",
      disgusted: "Validate their discomfort. Help them process what's bothering them without judgment.",
      surprised: "Acknowledge the unexpected nature of their experience. Help them process and make sense of it.",
      neutral: "Engage warmly and explore what's on their mind. Create a comfortable space for them to open up.",
    };

    if (emotionGuidance[emotion]) {
      basePrompt += `\n\nSpecific guidance for ${emotion}: ${emotionGuidance[emotion]}`;
    }
  }

  return basePrompt;
}
