/**
 * LLM API Types
 *
 * This file contains all API types related to the LLM service.
 * These are defined with @tsoaModel decorator to be picked up by the API generation process.
 */

/**
 * LLM Model Data Structure
 * @tsoaModel
 */
export interface LLMModelData {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

/**
 * LLM Models Response
 * @tsoaModel
 */
export interface LLMModelsResponseDto {
  object: string;
  data: LLMModelData[];
}

/**
 * LLM Completion Message
 * @tsoaModel
 */
export interface LLMCompletionMessage {
  role: string;
  content: string;
  name?: string;
}

/**
 * LLM Completion Request
 * @tsoaModel
 */
export interface LLMCompletionRequestDto {
  model: string;
  messages: LLMCompletionMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

/**
 * LLM Completion Response Choice
 * @tsoaModel
 */
export interface LLMCompletionResponseChoice {
  index: number;
  message: LLMCompletionMessage;
  finish_reason: string;
}

/**
 * LLM Completion Response Usage
 * @tsoaModel
 */
export interface LLMCompletionResponseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * LLM Completion Response
 * @tsoaModel
 */
export interface LLMCompletionResponseDto {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LLMCompletionResponseChoice[];
  usage: LLMCompletionResponseUsage;
}
