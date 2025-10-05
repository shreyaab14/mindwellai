import { 
  type TherapySession, 
  type InsertTherapySession,
  type Message,
  type InsertMessage,
  type EmotionRecord,
  type InsertEmotionRecord 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createSession(): Promise<TherapySession>;
  getSession(id: string): Promise<TherapySession | undefined>;
  endSession(id: string, duration: number): Promise<TherapySession | undefined>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getSessionMessages(sessionId: string): Promise<Message[]>;
  
  createEmotionRecord(record: InsertEmotionRecord): Promise<EmotionRecord>;
  getSessionEmotions(sessionId: string): Promise<EmotionRecord[]>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, TherapySession>;
  private messages: Map<string, Message>;
  private emotions: Map<string, EmotionRecord>;

  constructor() {
    this.sessions = new Map();
    this.messages = new Map();
    this.emotions = new Map();
  }

  async createSession(): Promise<TherapySession> {
    const id = randomUUID();
    const session: TherapySession = {
      id,
      startedAt: new Date(),
      endedAt: null,
      duration: null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<TherapySession | undefined> {
    return this.sessions.get(id);
  }

  async endSession(id: string, duration: number): Promise<TherapySession | undefined> {
    const session = this.sessions.get(id);
    if (session) {
      session.endedAt = new Date();
      session.duration = duration;
      this.sessions.set(id, session);
    }
    return session;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createEmotionRecord(insertRecord: InsertEmotionRecord): Promise<EmotionRecord> {
    const id = randomUUID();
    const record: EmotionRecord = {
      ...insertRecord,
      id,
      timestamp: new Date(),
    };
    this.emotions.set(id, record);
    return record;
  }

  async getSessionEmotions(sessionId: string): Promise<EmotionRecord[]> {
    return Array.from(this.emotions.values())
      .filter(emotion => emotion.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
