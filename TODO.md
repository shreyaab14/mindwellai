# MindWellAI Improvement Plan

## Goal
Improve chat effectiveness, voice features, and deploy to Vercel.

## Tasks

- [ ] **1. Improve AI Therapy Responses** (`server/openai.ts`)
  - Better system prompt with CBT/mindfulness techniques
  - Contextual mock responses based on message sentiment
  - Add conversation memory/follow-up questions
  - Emotion-aware response adaptation

- [ ] **2. Add Quick Reply Chips** (`client/src/components/MessageInput.tsx`)
  - Chips: "I'm feeling anxious", "I'm sad today", "I need help", etc.
  - One-click emotional state sharing
  - Context-aware chip suggestions

- [ ] **3. Allow Chat Without Webcam** (`client/src/pages/home.tsx`)
  - Start session without camera
  - Manual emotion selection dropdown
  - Webcam becomes optional, not mandatory

- [ ] **4. Improve Voice UI** (new `VoiceRecorder.tsx`, update `MessageInput.tsx`)
  - Real-time audio waveform visualization
  - Prominent record button with pulse animation
  - Voice message playback in chat bubbles
  - Better speech recognition feedback

- [ ] **5. Improve Voice Emotion Detection** (`client/src/lib/voiceAnalysis.ts`)
  - Use TensorFlow.js for audio feature extraction
  - Better pitch/tonal analysis
  - More accurate emotion classification
  - Confidence calibration

- [ ] **6. Improve Chat Interface UX** (`client/src/components/ChatInterface.tsx`)
  - Better typing indicator with animated dots
  - Message reaction buttons (helpful, thanks, etc.)
  - Better markdown/formatting support
  - Timestamp grouping (Today, Yesterday)

- [ ] **7. Fix Vercel Deployment** (`vercel.json`, `package.json`)
  - Correct build output directory
  - Proper route handling for SPA
  - API route configuration

- [ ] **8. Build & Test**
  - `npm run build`
  - Verify dist/ output
  - Test locally before deploying
