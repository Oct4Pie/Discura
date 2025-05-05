/**
 * Database interface that defines operations any database implementation must support
 */
export interface Database {
  /**
   * Initialize the database connection and create schema if necessary
   */
  initialize(): Promise<void>;
  
  /**
   * Close the database connection cleanly
   */
  close(): Promise<void>;
  
  /**
   * Get a single row from the database
   * 
   * @param query SQL query with placeholders
   * @param params Parameters to bind to query placeholders
   * @returns Single row or null if not found
   */
  get<T = any>(query: string, params?: any[]): Promise<T | null>;
  
  /**
   * Get multiple rows from the database
   * 
   * @param query SQL query with placeholders
   * @param params Parameters to bind to query placeholders
   * @returns Array of rows (empty array if none found)
   */
  query<T = any>(query: string, params?: any[]): Promise<T[]>;
  
  /**
   * Execute a query that doesn't return data (INSERT, UPDATE, DELETE, etc.)
   * 
   * @param query SQL query with placeholders
   * @param params Parameters to bind to query placeholders
   * @returns Number of rows affected
   */
  execute(query: string, params?: any[]): Promise<number>;
  
  /**
   * Run a query within a transaction
   * 
   * @param callback Function that performs database operations within transaction
   * @returns Result of the callback function
   */
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  
  /**
   * Insert a row into a table
   * 
   * @param table Table name
   * @param data Object containing data to insert (keys are column names)
   * @returns ID of inserted row or row count for tables without rowid
   */
  insert(table: string, data: Record<string, any>): Promise<number | string>;
  
  /**
   * Update rows in a table
   * 
   * @param table Table name
   * @param data Object containing data to update (keys are column names)
   * @param where WHERE clause (without the "WHERE" keyword)
   * @param params Parameters to bind to WHERE clause placeholders
   * @returns Number of rows affected
   */
  update(table: string, data: Record<string, any>, where: string, params?: any[]): Promise<number>;
  
  /**
   * Delete rows from a table
   * 
   * @param table Table name
   * @param where WHERE clause (without the "WHERE" keyword)
   * @param params Parameters to bind to WHERE clause placeholders
   * @returns Number of rows affected
   */
  delete(table: string, where: string, params?: any[]): Promise<number>;
}

/**
 * Database service interface used by the factory
 * Extends the base Database interface with additional methods
 */
export interface IDatabaseService extends Database {
  /**
   * Execute a SQL query without returning results
   */
  exec(query: string, params?: any[]): Promise<void>;
  
  /**
   * Run a SQL query and get the number of affected rows
   */
  run(query: string, params?: any[]): Promise<number>;
  
  /**
   * Execute a write operation within a transaction or queue
   */
  executeWrite<T>(callback: () => Promise<T>): Promise<T>;
}