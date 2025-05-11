/**
 * Knowledge API Types
 * 
 * This file contains all API types related to the Knowledge service.
 * These are defined with @tsoaModel decorator to be picked up by the API generation process.
 */

/**
 * Knowledge Item Data
 * @tsoaModel
 */
export interface KnowledgeItemDto {
  id: number | string;
  title: string;
  content: string;
  type: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Knowledge Base Response Data
 * @tsoaModel
 */
export interface KnowledgeBaseResponseDto {
  botId: string;
  items: KnowledgeItemDto[];
}