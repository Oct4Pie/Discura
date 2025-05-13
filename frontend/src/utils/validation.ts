/**
 * Validation utility functions for form inputs
 */

export const validate = {
  /**
   * Check if a value is not empty
   */
  required: (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  
  /**
   * Check if a string meets minimum length
   */
  minLength: (value: string, min: number): boolean => {
    if (!value) return false;
    return value.trim().length >= min;
  },
  
  /**
   * Check if a string doesn't exceed maximum length
   */
  maxLength: (value: string, max: number): boolean => {
    if (!value) return true;
    return value.trim().length <= max;
  },
  
  /**
   * Check if a value is a valid email
   */
  email: (value: string): boolean => {
    if (!value) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Check if a Discord token has the correct format
   * This is a basic format check, not a full validation
   */
  discordToken: (token: string): boolean => {
    if (!token) return false;
    // Discord tokens are typically dot-separated segments
    // This is just a basic format check, not a full validation
    return /^[\w-]{24}\.[\w-]{6}\.[\w-]{27}$/.test(token);
  }
};