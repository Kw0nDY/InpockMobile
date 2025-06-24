import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

// Environment validation with detailed error messages
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is missing');
  console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('PG')));
  throw new Error("DATABASE_URL must be set. Check your environment configuration.");
}

// Validate DATABASE_URL format
const dbUrlPattern = /^postgresql:\/\/.*$/;
if (!dbUrlPattern.test(process.env.DATABASE_URL)) {
  console.error('Invalid DATABASE_URL format:', process.env.DATABASE_URL.substring(0, 20) + '...');
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection string");
}

// Create connection pool with error handling
let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    // Connection pool configuration for reliability
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  db = drizzle({ client: pool, schema });
  
  // Test connection on startup
  pool.connect().then(client => {
    console.log('Database connection established successfully');
    client.release();
  }).catch(error => {
    console.error('Database connection test failed:', error);
  });
  
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export { pool, db };
