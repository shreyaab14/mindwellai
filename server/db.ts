import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema";

// Use HTTP fetch for queries in serverless environments (better compatibility)
neonConfig.poolQueryViaFetch = true;

// Only require DATABASE_URL if we're actually using the database
let pool: Pool | null = null;
let db: NeonDatabase<typeof schema> | null = null;

if (process.env.DATABASE_URL) {
  try {
    // Dynamically import ws only if WebSocket is actually needed (fallback from fetch)
    if (!neonConfig.poolQueryViaFetch) {
      import("ws").then(({ default: WebSocket }) => {
        neonConfig.webSocketConstructor = WebSocket;
      }).catch(() => {
        console.log("[db] ws module not available, using fetch only");
      });
    }
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("[db] Database connection initialized");
  } catch (error) {
    console.error("[db] Failed to initialize database:", error);
    console.log("[db] Falling back to in-memory storage");
  }
} else {
  console.log("[db] No DATABASE_URL provided, using in-memory storage");
}

export { pool, db };
