import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateTherapyResponse, type TherapyContext } from "./openai";
import { insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/sessions/start", async (req, res) => {
    try {
      const session = await storage.createSession();
      res.json({ sessionId: session.id });
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  app.post("/api/sessions/end", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      const updatedSession = await storage.endSession(sessionId, duration);
      
      res.json({ success: true, session: updatedSession });
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      const session = await storage.getSession(validatedData.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const userMessage = await storage.createMessage({
        sessionId: validatedData.sessionId,
        role: "user",
        content: validatedData.content,
        emotion: validatedData.emotion,
        emotionConfidence: validatedData.emotionConfidence,
      });

      const conversationHistory = await storage.getSessionMessages(validatedData.sessionId);
      const context: TherapyContext = {
        emotion: validatedData.emotion || undefined,
        emotionConfidence: validatedData.emotionConfidence ? validatedData.emotionConfidence / 100 : undefined,
        conversationHistory: conversationHistory
          .filter(msg => msg.id !== userMessage.id)
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))
          .slice(-10),
      };

      const therapyResponse = await generateTherapyResponse(validatedData.content, context);

      const assistantMessage = await storage.createMessage({
        sessionId: validatedData.sessionId,
        role: "assistant",
        content: therapyResponse,
        emotion: null,
        emotionConfidence: null,
      });

      res.json({ 
        response: therapyResponse,
        messageId: assistantMessage.id,
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.post("/api/emotions", async (req, res) => {
    try {
      const { sessionId, emotion, confidence } = req.body;
      
      if (!sessionId || !emotion || confidence === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const record = await storage.createEmotionRecord({
        sessionId,
        emotion,
        confidence: Math.round(confidence * 100),
      });

      res.json({ success: true, record });
    } catch (error) {
      console.error("Error recording emotion:", error);
      res.status(500).json({ error: "Failed to record emotion" });
    }
  });

  app.get("/api/sessions/:sessionId/emotions", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const emotions = await storage.getSessionEmotions(sessionId);
      res.json({ emotions });
    } catch (error) {
      console.error("Error fetching emotions:", error);
      res.status(500).json({ error: "Failed to fetch emotions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
