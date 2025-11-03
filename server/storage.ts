import { 
  type TherapySession, 
  type InsertTherapySession,
  type Message,
  type InsertMessage,
  type EmotionRecord,
  type InsertEmotionRecord,
  therapySessions,
  messages,
  emotionRecords
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createSession(): Promise<TherapySession>;
  getSession(id: string): Promise<TherapySession | undefined>;
  endSession(id: string, duration: number): Promise<TherapySession | undefined>;
  getAllSessions(): Promise<TherapySession[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getSessionMessages(sessionId: string): Promise<Message[]>;
  
  createEmotionRecord(record: InsertEmotionRecord): Promise<EmotionRecord>;
  getSessionEmotions(sessionId: string): Promise<EmotionRecord[]>;
  getAllEmotionRecords(): Promise<EmotionRecord[]>;
}

export class DatabaseStorage implements IStorage {
  async createSession(): Promise<TherapySession> {
    const [session] = await db
      .insert(therapySessions)
      .values({})
      .returning();
    return session;
  }

  async getSession(id: string): Promise<TherapySession | undefined> {
    const [session] = await db
      .select()
      .from(therapySessions)
      .where(eq(therapySessions.id, id));
    return session || undefined;
  }

  async endSession(id: string, duration: number): Promise<TherapySession | undefined> {
    const [session] = await db
      .update(therapySessions)
      .set({ endedAt: new Date(), duration })
      .where(eq(therapySessions.id, id))
      .returning();
    return session || undefined;
  }

  async getAllSessions(): Promise<TherapySession[]> {
    return await db
      .select()
      .from(therapySessions)
      .orderBy(desc(therapySessions.startedAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.timestamp);
  }

  async createEmotionRecord(insertRecord: InsertEmotionRecord): Promise<EmotionRecord> {
    const [record] = await db
      .insert(emotionRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async getSessionEmotions(sessionId: string): Promise<EmotionRecord[]> {
    return await db
      .select()
      .from(emotionRecords)
      .where(eq(emotionRecords.sessionId, sessionId))
      .orderBy(emotionRecords.timestamp);
  }

  async getAllEmotionRecords(): Promise<EmotionRecord[]> {
    return await db
      .select()
      .from(emotionRecords)
      .orderBy(desc(emotionRecords.timestamp));
  }
}

export const storage = new DatabaseStorage();
