/**
 * Internal LLM Types
 *
 * This file contains non-API types related to LLM services that are shared
 * between frontend and backend.
 */

/**
 * LLM internal response interface for service communications
 * This is a non-API type (internal use only), so it does not use @tsoaModel
 */
export interface LLMResponse {
  text: string;
  toolCalls?: any[];
}