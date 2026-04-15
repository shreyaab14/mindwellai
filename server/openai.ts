import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "mock-key" });

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
    // Fallback to mock therapeutic response for development
    return generateMockTherapyResponse(userMessage, context);
  }
}

function generateMockTherapyResponse(userMessage: string, context: TherapyContext): string {
  // Detect key topics from the message
  const hasNegativeEmotions = /sad|angry|frustrated|anxious|scared|worried|hurt|confused|lost|stressed/i.test(userMessage);
  const hasFeelingsOfHope = /better|happy|excited|grateful|hopeful|positive|good|well/i.test(userMessage);
  const isQuestion = /\?$/.test(userMessage);
  
  const mockResponses = {
    sad: [
      "I can hear that you're feeling down right now. Sadness is a valid emotion, and it's okay to feel this way. Would you like to talk about what's been weighing on your heart?",
      "It sounds like you're going through a difficult time. Remember, emotions come and go, and this feeling won't last forever. What would help you feel a bit better right now?",
      "I'm here to listen and support you. Sometimes just expressing how we feel can help lighten the load. Tell me more about what's on your mind.",
    ],
    angry: [
      "I sense some anger in what you're sharing. Anger can be a powerful emotion that often masks deeper hurt or frustration. What's really bothering you beneath this feeling?",
      "It's completely valid to feel angry. Let's take a moment to understand what triggered this feeling and what you need right now.",
      "Thank you for sharing your honest feelings. What would help you feel more calm or in control right now?",
    ],
    anxious: [
      "It sounds like anxiety is affecting you right now. Let's focus on what you can control in this moment. What's one small thing you could do to feel a bit more grounded?",
      "Anxiety can make everything feel overwhelming. Remember, you're safe right now. Would a grounding technique or breathing exercise help?",
      "I'm here with you. Let's work through this together. What's the main worry on your mind?",
    ],
    hopeful: [
      "I'm glad to hear you're feeling more positive! That's wonderful. What's helping you feel this way?",
      "It's beautiful to hear some hope in your words. How can you nurture this feeling and build on it?",
      "Your positive energy is uplifting. What positive changes have you noticed in yourself?",
    ],
    neutral: [
      "Thank you for sharing that with me. I'm curious to understand more about your experience. Can you tell me a bit more?",
      "That's an important point. How has that been affecting you emotionally?",
      "I appreciate you opening up. What would be most helpful for you to focus on right now?",
    ],
  };

  let responses: string[] = [];
  
  if (hasNegativeEmotions) {
    if (userMessage.toLowerCase().includes('sad') || userMessage.toLowerCase().includes('depressed')) {
      responses = mockResponses.sad;
    } else if (userMessage.toLowerCase().includes('angry') || userMessage.toLowerCase().includes('frustrated')) {
      responses = mockResponses.angry;
    } else if (userMessage.toLowerCase().includes('anxious') || userMessage.toLowerCase().includes('worried')) {
      responses = mockResponses.anxious;
    }
  } else if (hasFeelingsOfHope) {
    responses = mockResponses.hopeful;
  } else {
    responses = mockResponses.neutral;
  }

  // Select a random response from the appropriate category
  const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Add emotional context if available
  if (context.emotion) {
    return `I notice you might be feeling ${context.emotion}. ${selectedResponse}`;
  }
  
  return selectedResponse;
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

export interface SessionSummary {
  overview: string;
  keyInsights: string[];
  emotionalJourney: string;
  recommendations: string[];
}

export async function generateSessionSummary(
  messages: Array<{ role: string; content: string }>,
  emotions: Array<{ emotion: string; timestamp: Date }>
): Promise<SessionSummary> {
  const emotionSummary = emotions.map(e => e.emotion).join(', ');
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const prompt = `Analyze this therapy session and provide a structured summary:

Emotions detected: ${emotionSummary}

Conversation:
${conversationText}

Please provide:
1. A brief overview (2-3 sentences) of what was discussed
2. 3-5 key insights or themes that emerged
3. A description of the emotional journey during the session
4. 2-3 personalized recommendations for continued growth

Format your response as JSON with these keys: overview, keyInsights (array), emotionalJourney, recommendations (array)`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a compassionate therapist creating helpful session summaries. Be warm, insightful, and supportive.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content) as SessionSummary;
  } catch (error) {
    console.error("Error generating session summary:", error);
    return {
      overview: "This session focused on emotional expression and self-reflection.",
      keyInsights: ["The user engaged openly with their feelings", "Progress was made in self-understanding"],
      emotionalJourney: "The session showed varied emotional states reflecting authentic engagement.",
      recommendations: ["Continue practicing self-awareness", "Consider journaling between sessions"],
    };
  }
}
