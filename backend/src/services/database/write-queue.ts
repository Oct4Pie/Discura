import { logger } from '../../utils/logger';

/**
 * A queue for serializing write operations to prevent SQLite database locking issues
 * This class ensures that only one write operation happens at a time
 */
export class WriteQueue {
  private queue: Promise<any> = Promise.resolve();
  private activeOperations = 0;
  private maxConcurrentOperations = 1; // For SQLite, we want serialized writes
  
  /**
   * Enqueues an operation to be executed when previous operations complete
   * @param operation Function that performs the database operation
   * @returns Result of the operation
   */
  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    // Create a new promise that will be resolved when this operation completes
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    // Chain this operation to execute after the current queue completes
    this.queue = this.queue.then(async () => {
      // Wait if we've reached the maximum number of concurrent operations
      while (this.activeOperations >= this.maxConcurrentOperations) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      this.activeOperations++;
      
      try {
        // Execute the operation and resolve the promise with its result
        const result = await operation();
        resolve(result);
        return result;
      } catch (error) {
        // If operation fails, reject the promise
        reject(error);
        throw error;
      } finally {
        this.activeOperations--;
      }
    }).catch(error => {
      // Ensure queue continues even if an operation fails
      console.error('Error in database write queue:', error);
    });
    
    return promise;
  }
}