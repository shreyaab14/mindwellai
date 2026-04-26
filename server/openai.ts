import 'dotenv/config';
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("[openai.ts] OPENAI_API_KEY not found in environment — AI responses will use fallback mock mode");
}
const openai = new OpenAI({ apiKey: apiKey || "missing-key" });

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
      model: "gpt-4o",
      messages,
      max_tokens: 2048,
      temperature: 0.8,
    });

    return response.choices[0].message.content || "I'm here to listen. Please continue.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return generateMockTherapyResponse(userMessage, context);
  }
}

function generateMockTherapyResponse(userMessage: string, context: TherapyContext): string {
  const lowerMsg = userMessage.toLowerCase();
  
  const emotionalPatterns: Record<string, string[]> = {
    sad: ['sad', 'depressed', 'down', 'cry', 'crying', 'tears', 'melancholy', 'grief', 'grieving', 'heartbroken', 'lonely', 'empty', 'numb'],
    anxious: ['anxious', 'anxiety', 'nervous', 'panic', 'worried', 'worry', 'stress', 'stressed', 'overwhelmed', 'restless', 'tense', 'scared', 'afraid', 'fear', 'stressed out', 'burned out'],
    angry: ['angry', 'anger', 'mad', 'furious', 'rage', 'irritated', 'annoyed', 'frustrated', 'upset', 'pissed'],
    happy: ['happy', 'joy', 'excited', 'grateful', 'thankful', 'blessed', 'cheerful', 'elated', 'content', 'peaceful', 'calm', 'good'],
    hopeless: ['hopeless', 'worthless', 'pointless', 'meaningless', 'give up', 'no point', 'why bother', 'can\'t go on', 'suicide', 'kill myself'],
    tired: ['tired', 'exhausted', 'fatigue', 'burnout', 'drained', 'no energy', 'sleepy', 'worn out'],
    confused: ['confused', 'lost', 'uncertain', 'don\'t know', 'unsure', 'conflicted', 'dilemma', 'stuck'],
  };

  let detectedEmotion = '';
  let maxMatches = 0;
  
  for (const [emotion, keywords] of Object.entries(emotionalPatterns)) {
    const matches = keywords.filter(k => lowerMsg.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedEmotion = emotion;
    }
  }

  if (!detectedEmotion && context.emotion) {
    detectedEmotion = context.emotion.toLowerCase();
  }
  
  if (!detectedEmotion) {
    detectedEmotion = 'neutral';
  }

  const responses: Record<string, Array<{ text: string; technique: string }>> = {
    sad: [
      { text: "I'm really sorry you're feeling this way. Sadness can feel so heavy, like carrying a weight that no one else can see. Can you tell me more about when this feeling started?", technique: "validation" },
      { text: "It takes courage to acknowledge when you're feeling down. Many people find that naming what they're going through helps — what word would you use to describe this sadness?", technique: "labeling" },
      { text: "Sometimes sadness comes from a specific loss, and sometimes it creeps in without a clear reason. Both are valid. What's your experience right now?", technique: "exploration" },
      { text: "I hear you. When sadness feels overwhelming, small actions can help — a warm drink, a short walk, or reaching out to someone you trust. What usually brings you even a tiny bit of comfort?", technique: "coping" },
      { text: "Your feelings matter, and you matter. Even in this difficult moment, you reached out, and that shows strength. What would feel supportive right now?", technique: "affirmation" },
    ],
    anxious: [
      { text: "Anxiety can make your mind race and your body feel on high alert. Let's slow things down together. Can you try taking a slow, deep breath with me — in for 4 counts, hold for 4, out for 4?", technique: "grounding" },
      { text: "I can hear the worry in your words. Anxiety often tricks us into thinking about the worst-case scenario. What's one thing you know for certain right now, in this moment?", technique: "cognitive" },
      { text: "When everything feels overwhelming, breaking things down helps. What's the very next small step you could take? Not the whole solution — just one tiny action?", technique: "actionable" },
      { text: "Your brain is trying to protect you by being alert, but it's working overtime right now. What usually helps you feel even a little more grounded when anxiety shows up?", technique: "normalization" },
      { text: "It's okay to feel anxious — it's a natural response. But you don't have to face it alone. Would it help to talk through what's specifically worrying you?", technique: "supportive" },
    ],
    angry: [
      { text: "I can hear that something has really upset you. Anger is a signal — it's telling us that a boundary was crossed or a need wasn't met. What do you think triggered this feeling?", technique: "insight" },
      { text: "Your anger is valid. Before we work through it, let's acknowledge it without judgment. Sometimes just saying 'I'm angry and that's okay' can be powerful. How does that feel?", technique: "acceptance" },
      { text: "When anger feels intense, it can help to pause and ask: what do I actually need right now? Is it space, understanding, or something to change? What comes up for you?", technique: "needs" },
      { text: "Anger often masks hurt or fear underneath. If you sit with this feeling for a moment, is there something deeper it might be protecting?", technique: "depth" },
      { text: "It's completely okay to feel angry. What would help you release some of this tension in a healthy way? Sometimes movement, writing, or talking it out helps.", technique: "release" },
    ],
    happy: [
      { text: "I'm so glad to hear you're feeling good! What's contributing to this positive feeling? Understanding what lifts us up helps us create more of those moments.", technique: "reinforcement" },
      { text: "That's wonderful! Positive emotions deserve celebration too. How can you hold onto this feeling and maybe even share it with someone else?", technique: "amplification" },
      { text: "It's beautiful that you're experiencing this. What's one thing you're grateful for in this moment? Gratitude and happiness often go hand in hand.", technique: "gratitude" },
    ],
    hopeless: [
      { text: "I'm really glad you reached out. When things feel hopeless, it can seem like nothing will ever change — but feelings are not facts. You've gotten through difficult moments before, even if you don't see it right now. Can we talk about what's making you feel this way?", technique: "gentle-reframing" },
      { text: "What you're feeling sounds incredibly painful. Please know that you don't have to carry this alone. Would you consider talking to a mental health professional who can provide more support? In the meantime, I'm here to listen.", technique: "professional-referral" },
      { text: "Sometimes when we're in the darkest moments, it's hard to remember that light exists. But it does, and so does hope — even if it feels far away right now. What's the smallest thing you could do to take care of yourself today?", technique: "micro-step" },
    ],
    tired: [
      { text: "Exhaustion — whether physical, mental, or emotional — is your body asking for rest. What would real rest look like for you right now? Not just sleep, but true restoration?", technique: "rest" },
      { text: "Burnout is real, and it's not a sign of weakness. It's a sign that you've been giving too much without refilling your own cup. What boundaries could you set to protect your energy?", technique: "boundaries" },
      { text: "When we're drained, everything feels harder. Be gentle with yourself. What's one thing you could let go of today, just for now?", technique: "permission" },
    ],
    confused: [
      { text: "Feeling lost or uncertain is uncomfortable, but it's also a sign that you're in a place of growth and change. What part feels most unclear right now?", technique: "clarification" },
      { text: "Confusion often means we're processing something complex. Give yourself permission not to have all the answers right now. What would help you feel a bit more grounded?", technique: "patience" },
      { text: "Sometimes writing things down helps create clarity. If you were to describe your situation to a friend, what would you say? What advice might they give?", technique: "perspective" },
    ],
    neutral: [
      { text: "Thank you for sharing that with me. I'm curious — how are you really feeling right now, beneath the surface?", technique: "deeper" },
      { text: "I appreciate you reaching out. What brought you here today? Is there something specific on your mind, or are you just looking for a space to talk?", technique: "open" },
      { text: "Sometimes we don't have strong feelings — and that's okay too. What's one thing that's been on your mind lately, big or small?", technique: "gentle-probe" },
      { text: "I'm here to listen, whatever's going on. Would you like to explore a particular topic, or would you prefer I ask you some reflective questions?", technique: "choice" },
    ],
  };

  const emotionResponses = responses[detectedEmotion] || responses.neutral;
  const selected = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];

  let prefix = '';
  if (context.emotion && context.emotion.toLowerCase() !== detectedEmotion) {
    prefix = `I notice you mentioned feeling ${context.emotion}, and I'm also hearing ${detectedEmotion} in what you've shared. `;
  } else if (context.emotion && detectedEmotion === 'neutral') {
    prefix = `I sense you might be feeling ${context.emotion}. `;
  }

  const followUpOptions: Record<string, Array<{ type: 'question' | 'statement'; text: string }>> = {
    sad: [
      { type: 'question', text: "What would feel supportive right now?" },
      { type: 'statement', text: "I'm here with you in this. You don't have to carry it alone." },
      { type: 'question', text: "When did you first notice this feeling?" },
      { type: 'statement', text: "Even small moments of comfort matter right now. Be gentle with yourself." },
      { type: 'question', text: "Who in your life helps you feel understood?" },
      { type: 'statement', text: "Your feelings are valid, and so is your need for rest and care." },
    ],
    anxious: [
      { type: 'question', text: "What would help you feel 1% more grounded?" },
      { type: 'statement', text: "Let's take this one breath at a time. You're safe right now." },
      { type: 'question', text: "Is there a specific worry on your mind?" },
      { type: 'statement', text: "Anxiety is exhausting, but it doesn't define you. This feeling will pass." },
      { type: 'question', text: "What usually calms your nervous system?" },
      { type: 'statement', text: "Your brain is trying to protect you, even if it feels overwhelming right now." },
    ],
    angry: [
      { type: 'question', text: "What boundary might have been crossed?" },
      { type: 'statement', text: "Your anger is telling you something important. It deserves to be heard." },
      { type: 'question', text: "What do you need most in this moment?" },
      { type: 'statement', text: "It's okay to feel this. You don't have to suppress it for anyone." },
      { type: 'question', text: "How can you express this feeling safely?" },
      { type: 'statement', text: "Anger often protects a softer feeling underneath. You're allowed to explore that when you're ready." },
    ],
    happy: [
      { type: 'question', text: "What's one thing you're grateful for today?" },
      { type: 'statement', text: "I'm really glad you're feeling this way. You deserve these moments." },
      { type: 'question', text: "How can you carry this feeling forward?" },
      { type: 'statement', text: "Savor this feeling. Let yourself fully experience it without rushing to the next thing." },
      { type: 'question', text: "Who would love to hear about this?" },
      { type: 'statement', text: "Positive moments are worth celebrating. Thank you for sharing this with me." },
    ],
    hopeless: [
      { type: 'question', text: "What's one small thing you could do for yourself today?" },
      { type: 'statement', text: "I know it doesn't feel like it right now, but this heaviness is not permanent. You won't always feel this way." },
      { type: 'question', text: "When have you felt differently in the past?" },
      { type: 'statement', text: "You matter, even when it doesn't feel like it. Your presence here is enough." },
      { type: 'question', text: "Who could you reach out to for support?" },
      { type: 'statement', text: "Sometimes just getting through the day is enough. You don't have to solve everything right now." },
    ],
    tired: [
      { type: 'question', text: "What would real rest look like for you?" },
      { type: 'statement', text: "Rest is not a reward — it's a necessity. You have permission to slow down." },
      { type: 'question', text: "What could you say no to this week?" },
      { type: 'statement', text: "Your body is asking for care. Listen to it without guilt." },
      { type: 'question', text: "When did you last do something just for yourself?" },
      { type: 'statement', text: "Burnout is real, and it's not a sign of weakness. It's a sign you've been strong for too long." },
    ],
    confused: [
      { type: 'question', text: "What would clarity look like for you?" },
      { type: 'statement', text: "Not knowing is uncomfortable, but it's also where growth happens. Be patient with yourself." },
      { type: 'question', text: "If you trusted your gut, what would it say?" },
      { type: 'statement', text: "You don't need all the answers right now. It's okay to sit with the uncertainty." },
      { type: 'question', text: "What's one small step you could take?" },
      { type: 'statement', text: "Confusion often means you're processing something important. Give yourself time." },
    ],
    neutral: [
      { type: 'question', text: "What's on your mind right now?" },
      { type: 'statement', text: "I'm here to listen, whatever's going on. No pressure to feel anything specific." },
      { type: 'question', text: "How has your day been so far?" },
      { type: 'statement', text: "Sometimes neutral is exactly where we need to be. It's a valid place to rest." },
      { type: 'question', text: "Is there anything you'd like to explore?" },
      { type: 'statement', text: "You don't have to have strong feelings to deserve support. I'm here either way." },
    ],
  };

  const options = followUpOptions[detectedEmotion] || followUpOptions.neutral;
  const selectedOption = options[Math.floor(Math.random() * options.length)];

  // Only add follow-up 70% of the time, and alternate between questions and statements
  const shouldAddFollowUp = Math.random() > 0.3;
  
  if (shouldAddFollowUp) {
    return `${prefix}${selected.text}

${selectedOption.text}`;
  } else {
    return `${prefix}${selected.text}`;
  }
}

function buildSystemPrompt(emotion?: string, confidence?: number): string {
  let basePrompt = `You are MindWell, a warm, empathetic AI therapy companion. Your name is MindWell. You provide supportive mental health guidance with the following approach:

## Core Principles
1. **Validate first, always** — Acknowledge the user's feelings before offering any suggestions
2. **Use evidence-based techniques** — CBT reframing, mindfulness, grounding exercises, self-compassion
3. **Be conversational and warm** — Use "we" and "together" language, avoid clinical jargon
4. **Keep it human-sized** — 2-4 sentences of support, then ONE thoughtful question OR a reflective statement (not both)
5. **Never diagnose** — You're a supportive companion, not a doctor
6. **Know your limits** — For crisis language, gently suggest professional help
7. **Vary your responses** — Don't always ask questions. Sometimes offer validation, a coping technique, or simply sit with them in silence

## Response Structure
- Start with empathetic validation ("I hear that you're feeling...")
- Offer one specific insight, technique, or supportive statement
- End with EITHER an open question OR a reflective closing statement — alternate between them

## What to Avoid
- Don't ask more than one question per response
- Don't use the same follow-up pattern every time ("What would help?", "What's on your mind?")
- Don't force psychoeducation — keep it conversational
- Avoid: "You should," "Just think positive," "At least..."
- Instead: "What if we tried...," "It sounds like...," "Many people find...", "I'm here with you"`;

  if (emotion && confidence !== undefined) {
    const confidencePercent = Math.round(confidence * 100);
    basePrompt += `\n\n## Current Session Context\nThe user appears to be feeling **${emotion}** (${confidencePercent}% confidence detected).`;
    
    const emotionGuidance: Record<string, string> = {
      sad: "Be extra gentle. Validate the heaviness. Offer small, manageable steps. Avoid toxic positivity.",
      angry: "Stay calm and accepting. Help them identify the unmet need behind the anger. No judgment.",
      fearful: "Provide reassurance without dismissal. Help them name specific fears. Grounding techniques help.",
      happy: "Celebrate with them! Explore what's working. Help them savor and remember this feeling.",
      disgusted: "Accept their reaction without minimizing. Help them process what triggered this response.",
      surprised: "Help them integrate the unexpected. Normalize that surprises can be disorienting.",
      neutral: "Be curious and warm. Explore gently. They may be masking deeper feelings.",
    };

    if (emotionGuidance[emotion]) {
      basePrompt += `\n\nGuidance for ${emotion}: ${emotionGuidance[emotion]}`;
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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a compassionate therapist creating helpful session summaries. Be warm, insightful, and supportive.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
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
