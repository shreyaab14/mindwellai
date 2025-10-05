# Mental Health Monitoring System

## Overview

An AI-powered mental health monitoring application that uses real-time facial emotion detection to provide supportive therapeutic conversations. The system analyzes user emotions through webcam video feed and delivers empathetic, personalized guidance through an AI therapist interface. Built with a focus on privacy, accessibility, and creating a calm, nurturing environment for users seeking mental health support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Shadcn UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for mental health-focused theming
- **State Management**: TanStack Query (React Query) for server state management

**Design Philosophy:**
- Hybrid approach drawing inspiration from wellness applications (Calm, Headspace, BetterHelp)
- Emotion-specific color coding for different mental states
- Dark/light theme support with custom color palettes optimized for therapeutic contexts
- Typography using Inter for UI and Poppins for headings to create a warm, approachable feel

**Key Frontend Components:**
- **WebcamView**: Manages video feed and canvas overlay for emotion detection visualization
- **EmotionIndicator**: Displays current detected emotion with confidence levels
- **ChatInterface**: Scrollable conversation view with role-based message styling
- **MessageInput**: Text input with keyboard shortcuts for sending messages
- **EmotionTimeline**: Real-time chart showing emotion changes over the last 60 seconds

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with JSON request/response format
- **Development**: Hot module replacement via Vite in development mode

**Server Structure:**
- Session-based architecture where each therapy session gets a unique identifier
- In-memory storage implementation (MemStorage) with interface-based design for future database migration
- Centralized error handling middleware
- Request/response logging for API endpoints

**API Endpoints:**
- `POST /api/sessions/start` - Initiates a new therapy session
- `POST /api/sessions/end` - Concludes a session and records duration
- `POST /api/messages` - Handles message exchange and AI response generation

### Database Design

**ORM**: Drizzle ORM configured for PostgreSQL with schema-first approach

**Core Tables:**
1. **therapy_sessions**: Tracks individual therapy sessions with timestamps and duration
2. **messages**: Stores conversation history with role (user/assistant), content, and associated emotion data
3. **emotion_records**: Logs all detected emotions with confidence scores and timestamps

**Schema Features:**
- UUID primary keys for all tables
- Automatic timestamp tracking with `defaultNow()`
- Foreign key relationships through sessionId
- Zod validation schemas generated from Drizzle schemas for type-safe data validation

**Design Rationale**: 
- Schema separation allows for easy migration from in-memory to persistent storage
- Session-centric design enables session history tracking and analytics
- Emotion records stored separately from messages for flexible querying and timeline generation

### AI Integration

**Service**: OpenAI GPT-5 API

**Implementation Pattern:**
- Context-aware prompt engineering with system prompts tailored for therapeutic conversations
- Conversation history maintained and passed to API for contextual responses
- Emotion data integrated into system prompts to influence AI responses
- Error handling with graceful fallbacks for API failures

**Prompt Strategy**:
- Base system prompt establishes empathetic, non-clinical therapist persona
- Dynamic prompt augmentation based on detected emotions and confidence levels
- Clear boundaries set to avoid medical diagnosis and encourage professional help when needed
- Max completion tokens set to 2048 for detailed, thoughtful responses

### Client-Side ML

**Library**: @vladmandic/face-api (TensorFlow.js-based)

**Architecture**:
- CDN-loaded ML models for face detection and expression recognition
- Lazy loading pattern - models loaded only when session starts
- Singleton pattern for model loading to prevent redundant downloads
- Real-time detection loop with configurable intervals

**Detection Pipeline**:
1. TinyFaceDetector for efficient face localization
2. FaceExpressionNet for emotion classification
3. Emotion mapping to 7 categories: happy, sad, angry, fearful, disgusted, surprised, neutral
4. Confidence thresholding and result caching

**Privacy Consideration**: All ML processing happens client-side in the browser - no video/image data sent to servers

### Authentication & Security

**Current State**: No authentication system implemented

**Privacy Features**:
- Client-side emotion detection (no video data transmission)
- Session-based data isolation
- Privacy badges visible to users indicating local processing
- HTTPS enforced in production (via deployment platform)

### Build & Deployment

**Development**:
- TypeScript compilation without emit (type checking only)
- Vite dev server with HMR for client
- tsx for running TypeScript server directly
- Separate client and server watch processes

**Production Build**:
- Vite builds client bundle to `dist/public`
- esbuild bundles server to `dist/index.js` with ESM format
- External packages not bundled for server (leverages node_modules)
- Platform-specific optimizations (node platform target)

**Configuration Files**:
- `vite.config.ts`: Client build configuration with path aliases
- `tsconfig.json`: Shared TypeScript config with strict mode enabled
- `tailwind.config.ts`: Custom theme tokens for mental health design system
- `drizzle.config.ts`: Database migration configuration

## External Dependencies

### Required Services

1. **PostgreSQL Database**
   - Required for persistent storage (via DATABASE_URL environment variable)
   - Currently using @neondatabase/serverless driver for serverless compatibility
   - Drizzle ORM manages schema and migrations

2. **OpenAI API**
   - Required for therapy response generation
   - Uses GPT-5 model (latest as of August 2025)
   - API key required via OPENAI_API_KEY environment variable

### Third-Party Integrations

1. **Face Detection Models (CDN)**
   - Hosted at cdn.jsdelivr.net
   - TinyFaceDetector model for face localization
   - FaceExpressionNet model for emotion classification
   - Loaded at runtime from client

2. **Google Fonts**
   - Inter font family for UI components
   - Poppins font family for headings
   - Preconnected for performance optimization

### Key NPM Packages

**UI & Styling**:
- Radix UI component primitives (20+ packages for accessible components)
- Tailwind CSS with PostCSS for styling
- class-variance-authority for component variant management
- Recharts for emotion timeline visualization

**Data & State**:
- TanStack Query for server state management
- React Hook Form with Zod resolvers for form validation
- Drizzle ORM for database operations

**ML & AI**:
- @tensorflow/tfjs for ML runtime
- @vladmandic/face-api for facial emotion detection
- OpenAI SDK for AI responses

**Development**:
- Vite with React plugin for fast development
- tsx for TypeScript execution
- esbuild for production server bundling
- Replit-specific plugins for development environment integration