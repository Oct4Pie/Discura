import { IDatabaseService } from "./database.interface";
import { SQLiteDatabase } from "./sqlite.database";
import config from "../../config";
import { logger } from "../../utils/logger";

/**
 * Database factory for selecting and initializing the appropriate database service
 * based on configuration.
 */
class DatabaseFactory {
  private dbInstance: IDatabaseService | null = null;

  /**
   * Initialize the database service based on configuration
   */
  async initialize(): Promise<void> {
    const dbType = config.database.type;

    switch (dbType) {
      case "sqlite":
        logger.info("Initializing SQLite database");
        this.dbInstance = new SQLiteDatabase(config.database.sqlite.path);
        break;

      // We can add support for other databases like Turso here in the future
      // case 'turso':
      //   logger.info('Initializing Turso database');
      //   this.dbInstance = new TursoDatabase(config.database.turso.url, config.database.turso.authToken);
      //   break;

      default:
        logger.info(`Unknown database type: ${dbType}, defaulting to SQLite`);
        this.dbInstance = new SQLiteDatabase(config.database.sqlite.path);
    }

    await this.dbInstance.initialize();
  }

  /**
   * Get a single item from the database
   */
  async get<T = any>(query: string, params?: any[]): Promise<T | null> {
    this.ensureInitialized();
    return this.dbInstance!.get<T>(query, params);
  }

  /**
   * Query multiple items from the database
   */
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    this.ensureInitialized();
    return this.dbInstance!.query<T>(query, params);
  }

  /**
   * Execute a write operation (INSERT, UPDATE, DELETE)
   */
  async exec(query: string, params?: any[]): Promise<void> {
    this.ensureInitialized();
    return this.dbInstance!.exec(query, params);
  }

  /**
   * Execute a write operation and get the number of affected rows
   */
  async run(query: string, params?: any[]): Promise<number> {
    this.ensureInitialized();
    return this.dbInstance!.run(query, params);
  }

  /**
   * Execute a batch of operations in a transaction
   */
  async executeWrite(callback: () => Promise<any>): Promise<any> {
    this.ensureInitialized();
    return this.dbInstance!.executeWrite(callback);
  }

  /**
   * Insert a record into a table
   */
  async insert(
    table: string,
    data: Record<string, any>,
  ): Promise<string | number> {
    this.ensureInitialized();
    return this.dbInstance!.insert(table, data);
  }

  /**
   * Update records in a table
   */
  async update(
    table: string,
    data: Record<string, any>,
    whereClause: string,
    whereParams?: any[],
  ): Promise<number> {
    this.ensureInitialized();
    return this.dbInstance!.update(table, data, whereClause, whereParams);
  }

  /**
   * Delete records from a table
   */
  async delete(
    table: string,
    whereClause: string,
    whereParams?: any[],
  ): Promise<number> {
    this.ensureInitialized();
    return this.dbInstance!.delete(table, whereClause, whereParams);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.dbInstance) {
      await this.dbInstance.close();
      this.dbInstance = null;
    }
  }

  /**
   * Ensure that the database is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.dbInstance) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
  }
}

// Export singleton instance
export const db = new DatabaseFactory();
