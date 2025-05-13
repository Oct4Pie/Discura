import path from "path";

import { open, Database as SQLiteDB } from "sqlite";
import sqlite3 from "sqlite3";

import { Database, IDatabaseService } from "./database.interface";
import { WriteQueue } from "./write-queue";
import { logger } from "../../utils/logger";

/**
 * SQL statements to create the database schema
 */
const SCHEMA_STATEMENTS = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT NOT NULL,
    avatar TEXT,
    email TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  // Bots table
  `CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    application_id TEXT NOT NULL,
    discord_token TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Bot configurations table
  `CREATE TABLE IF NOT EXISTS bot_configurations (
    bot_id TEXT PRIMARY KEY,
    system_prompt TEXT NOT NULL DEFAULT '',
    personality TEXT NOT NULL DEFAULT '',
    backstory TEXT NOT NULL DEFAULT '',
    traits TEXT NOT NULL DEFAULT '[]',
    llm_provider TEXT NOT NULL DEFAULT '',
    llm_model TEXT NOT NULL DEFAULT '',
    api_key TEXT NOT NULL DEFAULT '',
    image_generation_enabled INTEGER NOT NULL DEFAULT 0,
    image_provider TEXT NOT NULL DEFAULT '',
    image_api_key TEXT,
    image_model TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
  )`,

  // Knowledge items table
  `CREATE TABLE IF NOT EXISTS knowledge_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bot_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
  )`,

  // Tool definitions table
  `CREATE TABLE IF NOT EXISTS tool_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bot_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    schema TEXT NOT NULL,
    implementation TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(bot_id, name),
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
  )`,

  // Sessions table for storing user sessions
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    data TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Create indexes for common queries
  `CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_bot_id ON knowledge_items(bot_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tools_bot_id ON tool_definitions(bot_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
];

/**
 * SQLite implementation of the Database interface
 */
export class SQLiteDatabase implements IDatabaseService {
  private db: SQLiteDB | null = null;
  private dbPath: string;
  private writeQueue: WriteQueue;

  constructor(dbFilePath: string) {
    this.dbPath = path.resolve(dbFilePath);
    this.writeQueue = new WriteQueue();

    // Enable debug logging for SQLite in development
    if (process.env.NODE_ENV !== "production") {
      sqlite3.verbose();
    }
  }

  /**
   * Initialize the database connection and create schema if necessary
   */
  async initialize(): Promise<void> {
    try {
      logger.info(`Initializing SQLite database at ${this.dbPath}`);

      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      // Enable foreign keys support
      await this.db.exec("PRAGMA foreign_keys = ON");

      // Set busy timeout to prevent SQLITE_BUSY errors
      await this.db.exec("PRAGMA busy_timeout = 5000");

      // Create tables if they don't exist
      await this.createSchema();

      logger.info("SQLite database initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SQLite database:", error);
      throw error;
    }
  }

  /**
   * Create database schema if it doesn't exist
   */
  private async createSchema(): Promise<void> {
    try {
      // Run all schema creation statements in a transaction
      await this.transaction(async () => {
        for (const statement of SCHEMA_STATEMENTS) {
          await this.db!.exec(statement);
        }
      });

      logger.info("Database schema created or verified");
    } catch (error) {
      logger.error("Error creating database schema:", error);
      throw error;
    }
  }

  /**
   * Close the database connection cleanly
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
        logger.info("SQLite database connection closed");
      } catch (error) {
        logger.error("Error closing SQLite database connection:", error);
        throw error;
      }
    }
  }

  /**
   * Get a single row from the database
   */
  async get<T = any>(query: string, params: any[] = []): Promise<T | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.get<T>(query, ...params);
      return result || null; // Convert undefined to null
    } catch (error) {
      logger.error(`Error executing get query: ${query}`, error);
      throw error;
    }
  }

  /**
   * Get multiple rows from the database
   */
  async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const results = await this.db.all<T[]>(query, ...params);
      return results || []; // Ensure we always return an array
    } catch (error) {
      logger.error(`Error executing query: ${query}`, error);
      throw error;
    }
  }

  /**
   * Execute a query that doesn't return data
   */
  async execute(query: string, params: any[] = []): Promise<number> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Use the write queue to prevent database locking issues
      return await this.writeQueue.enqueue(async () => {
        const result = await this.db!.run(query, ...params);
        return result.changes || 0; // Return 0 instead of undefined
      });
    } catch (error) {
      logger.error(`Error executing statement: ${query}`, error);
      throw error;
    }
  }

  /**
   * Run a query within a transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Use the write queue for the entire transaction
      return await this.writeQueue.enqueue(async () => {
        await this.db!.exec("BEGIN TRANSACTION");

        try {
          const result = await callback();
          await this.db!.exec("COMMIT");
          return result;
        } catch (error) {
          await this.db!.exec("ROLLBACK");
          throw error;
        }
      });
    } catch (error) {
      logger.error("Error executing transaction:", error);
      throw error;
    }
  }

  /**
   * Insert a row into a table
   */
  async insert(
    table: string,
    data: Record<string, any>,
  ): Promise<number | string> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((col) => data[col]);

      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

      // Use the write queue to prevent database locking issues
      return await this.writeQueue.enqueue(async () => {
        const result = await this.db!.run(sql, ...values);
        return result.lastID || 0; // Return 0 instead of undefined
      });
    } catch (error) {
      logger.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  /**
   * Update rows in a table
   */
  async update(
    table: string,
    data: Record<string, any>,
    where: string,
    params: any[] = [],
  ): Promise<number> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const columns = Object.keys(data);
      const setClause = columns.map((col) => `${col} = ?`).join(", ");
      const values = [...columns.map((col) => data[col]), ...params];

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;

      // Use the write queue to prevent database locking issues
      return await this.writeQueue.enqueue(async () => {
        const result = await this.db!.run(sql, ...values);
        return result.changes || 0; // Return 0 instead of undefined
      });
    } catch (error) {
      logger.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  /**
   * Delete rows from a table
   */
  async delete(
    table: string,
    where: string,
    params: any[] = [],
  ): Promise<number> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const sql = `DELETE FROM ${table} WHERE ${where}`;

      // Use the write queue to prevent database locking issues
      return await this.writeQueue.enqueue(async () => {
        const result = await this.db!.run(sql, ...params);
        return result.changes || 0; // Return 0 instead of undefined
      });
    } catch (error) {
      logger.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Execute a SQL query without returning results
   */
  async exec(query: string, params: any[] = []): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      if (params && params.length > 0) {
        // If parameters are provided, use run with parameters
        await this.db.run(query, ...params);
      } else {
        // If no parameters, use exec for better performance
        await this.db.exec(query);
      }
    } catch (error) {
      logger.error(`Error executing SQL: ${query}`, error);
      throw error;
    }
  }

  /**
   * Run a SQL query and get the number of affected rows
   */
  async run(query: string, params: any[] = []): Promise<number> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.run(query, ...params);
      return result.changes || 0; // Return 0 instead of undefined
    } catch (error) {
      logger.error(`Error running SQL: ${query}`, error);
      throw error;
    }
  }

  /**
   * Execute a write operation within a transaction or queue
   */
  async executeWrite<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      return await this.writeQueue.enqueue(callback);
    } catch (error) {
      logger.error("Error executing write operation:", error);
      throw error;
    }
  }
}
