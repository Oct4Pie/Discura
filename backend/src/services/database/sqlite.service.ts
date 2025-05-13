import fs from "fs";
import path from "path";

import { BOT_STATUS } from "@discura/common/constants"; // Import bot status constants
import { mkdirp } from "mkdirp";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";

import config from "../../config";
import { logger } from "../../utils/logger";

/**
 * SQLiteService - Manages SQLite database operations with optimizations
 *
 * Features:
 * - WAL mode for improved concurrency (multiple readers during writes)
 * - Write queue to prevent database lock contention
 * - Connection pooling for better performance
 * - Graceful error handling and retry mechanisms
 */
export class SQLiteService {
  private static instance: SQLiteService;
  private db: Database | null = null;
  private writeQueue: Array<() => Promise<unknown>> = [];
  private isProcessingQueue = false;
  private initialized = false;
  private dbPath: string;

  private constructor() {
    this.dbPath = config.database.sqlite.path;
  }

  /**
   * Get the singleton instance of SQLiteService
   */
  public static getInstance(): SQLiteService {
    if (!SQLiteService.instance) {
      SQLiteService.instance = new SQLiteService();
    }
    return SQLiteService.instance;
  }

  /**
   * Initialize the database - creates the database file and tables if they don't exist
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure data directory exists
      const dbDir = path.dirname(this.dbPath);
      await mkdirp(dbDir);

      logger.info(`Initializing SQLite database at ${this.dbPath}`);

      // Open the database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      });

      // Enable WAL mode for better concurrency
      await this.db.exec("PRAGMA journal_mode = WAL;");

      // Balance durability and performance
      // NORMAL syncs at critical moments but may lose data in a crash
      await this.db.exec("PRAGMA synchronous = NORMAL;");

      // Create tables
      await this.createTables();

      this.initialized = true;
      logger.info("SQLite database initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SQLite database:", error);
      throw error;
    }
  }

  /**
   * Create database tables if they don't exist
   */
  private async createTables(): Promise<void> {
    try {
      // Create users table
      await this.db?.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          discord_id TEXT UNIQUE NOT NULL,
          username TEXT NOT NULL,
          discriminator TEXT,
          avatar TEXT,
          email TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create bots table - use uppercase version of offline status for database
      await this.db?.exec(`
        CREATE TABLE IF NOT EXISTS bots (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          application_id TEXT NOT NULL,
          discord_token TEXT NOT NULL,
          status TEXT DEFAULT '${BOT_STATUS.OFFLINE.toUpperCase()}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // Create bot configurations table
      await this.db?.exec(`
        CREATE TABLE IF NOT EXISTS bot_configurations (
          bot_id TEXT PRIMARY KEY,
          system_prompt TEXT,
          personality TEXT,
          backstory TEXT,
          llm_provider TEXT,
          llm_model TEXT,
          api_key TEXT,
          image_generation_enabled INTEGER DEFAULT 0,
          image_provider TEXT,
          image_api_key TEXT,
          configuration_json TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        );
      `);

      // Create bot traits table (many-to-one relationship)
      await this.db?.exec(`
        CREATE TABLE IF NOT EXISTS bot_traits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bot_id TEXT NOT NULL,
          trait TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(bot_id, trait),
          FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        );
      `);

      // Create knowledge base items table
      await this.db?.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bot_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'text',
          priority INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        );
      `);

      // Create tool definitions table for function calling
      await this.db?.exec(`
        CREATE TABLE IF NOT EXISTS tool_definitions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bot_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          schema TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(bot_id, name),
          FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        );
      `);

      logger.info("SQLite tables created successfully");
    } catch (error) {
      logger.error("Failed to create SQLite tables:", error);
      throw error;
    }
  }

  /**
   * Execute a SQL query with parameters (safe for SELECT queries)
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.initialized) await this.initialize();
    try {
      const result = await this.db?.all<T>(sql, params);
      return result as T[];
    } catch (error) {
      logger.error(`SQLite query error: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Get a single row from a SQL query
   */
  public async get<T = any>(
    sql: string,
    params: any[] = [],
  ): Promise<T | null> {
    if (!this.initialized) await this.initialize();
    try {
      const result = await this.db?.get<T>(sql, params);
      return result || null;
    } catch (error) {
      logger.error(`SQLite get error: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Execute a write operation within a transaction
   * Uses a queue to prevent concurrent writes causing database locks
   */
  public async executeWrite<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        let result: T;
        try {
          await this.db?.exec("BEGIN TRANSACTION");
          result = await operation();
          await this.db?.exec("COMMIT");
          resolve(result);
          return result;
        } catch (error) {
          await this.db?.exec("ROLLBACK").catch((err) => {
            logger.error("Error during transaction rollback:", err);
          });
          reject(error);
          throw error;
        }
      });

      this.processWriteQueue();
    });
  }

  /**
   * Process the write operation queue
   */
  private async processWriteQueue(): Promise<void> {
    if (this.isProcessingQueue || this.writeQueue.length === 0) return;

    this.isProcessingQueue = true;
    try {
      const operation = this.writeQueue.shift();
      if (operation) {
        await operation();
      }
    } catch (error) {
      logger.error("Error processing write queue:", error);
    } finally {
      this.isProcessingQueue = false;
      if (this.writeQueue.length > 0) {
        this.processWriteQueue();
      }
    }
  }

  /**
   * Insert data into a table
   */
  public async insert(
    table: string,
    data: Record<string, any>,
  ): Promise<string | number> {
    return this.executeWrite(async () => {
      const columns = Object.keys(data).join(", ");
      const placeholders = Object.keys(data)
        .map(() => "?")
        .join(", ");
      const values = Object.values(data);

      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

      const result = await this.db?.run(sql, values);
      return result?.lastID || 0;
    });
  }

  /**
   * Update data in a table
   */
  public async update(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = [],
  ): Promise<number> {
    return this.executeWrite(async () => {
      const setClauses = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(data), ...whereParams];

      const sql = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;

      const result = await this.db?.run(sql, values);
      return result?.changes || 0;
    });
  }

  /**
   * Delete data from a table
   */
  public async delete(
    table: string,
    where: string,
    whereParams: any[] = [],
  ): Promise<number> {
    return this.executeWrite(async () => {
      const sql = `DELETE FROM ${table} WHERE ${where}`;

      const result = await this.db?.run(sql, whereParams);
      return result?.changes || 0;
    });
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
      logger.info("SQLite database connection closed");
    }
  }
}

// Export a singleton instance
export const sqliteService = SQLiteService.getInstance();
