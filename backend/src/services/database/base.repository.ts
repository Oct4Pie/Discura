import { db } from "./database.factory";
import { logger } from "../../utils/logger";

/**
 * BaseRepository - Generic repository with common CRUD operations
 *
 * This class provides a foundation for table-specific repositories with
 * standard data access patterns.
 */
export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find all records in the table
   */
  async findAll(): Promise<T[]> {
    try {
      return await db.query<T>(`SELECT * FROM ${this.tableName}`);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findAll:`, error);
      throw error;
    }
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      return await db.get<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [
        id,
      ]);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findById:`, error);
      throw error;
    }
  }

  /**
   * Find records matching a specific field value
   */
  async findByField(field: string, value: any): Promise<T[]> {
    try {
      return await db.query<T>(
        `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
        [value],
      );
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findByField:`, error);
      throw error;
    }
  }

  /**
   * Find one record matching a specific field value
   */
  async findOneByField(field: string, value: any): Promise<T | null> {
    try {
      return await db.get<T>(
        `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
        [value],
      );
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findOneByField:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<string | number> {
    try {
      return await db.insert(this.tableName, data);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.create:`, error);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(id: string, data: Partial<T>): Promise<boolean> {
    try {
      const result = await db.update(this.tableName, data, "id = ?", [id]);
      return result > 0;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.update:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(this.tableName, "id = ?", [id]);
      return result > 0;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.delete:`, error);
      throw error;
    }
  }
}
