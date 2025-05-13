/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ToolController } from './../controllers/tool.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LLMController } from './../controllers/llm.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { KnowledgeController } from './../controllers/knowledge.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/auth.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { BotController } from './../controllers/bot.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ConstantsController } from './../controllers/constants.controller';
import { expressAuthentication } from './../auth/authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "ToolDefinitionDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "botId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "schema": {"dataType":"object","required":true},
            "enabled": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"string"},
            "updatedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ToolDefinitionsResponseDto": {
        "dataType": "refObject",
        "properties": {
            "tools": {"dataType":"array","array":{"dataType":"refObject","ref":"ToolDefinitionDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateToolRequest": {
        "dataType": "refObject",
        "properties": {
            "botId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "schema": {"dataType":"object","required":true},
            "enabled": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateToolRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "schema": {"dataType":"object"},
            "enabled": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ToggleToolStatusRequest": {
        "dataType": "refObject",
        "properties": {
            "enabled": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelCapabilities": {
        "dataType": "refObject",
        "properties": {
            "input_modalities": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "output_modalities": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "supports_tool_calling": {"dataType":"boolean"},
            "supports_streaming": {"dataType":"boolean"},
            "supports_vision": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelPricing": {
        "dataType": "refObject",
        "properties": {
            "prompt_tokens": {"dataType":"double","required":true},
            "completion_tokens": {"dataType":"double","required":true},
            "currency": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMModelData": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "object": {"dataType":"string","required":true},
            "created": {"dataType":"double","required":true},
            "owned_by": {"dataType":"string","required":true},
            "display_name": {"dataType":"string","required":true},
            "provider_model_id": {"dataType":"string","required":true},
            "capabilities": {"ref":"ModelCapabilities"},
            "context_length": {"dataType":"double"},
            "pricing": {"ref":"ModelPricing"},
            "max_tokens": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMModelsResponseDto": {
        "dataType": "refObject",
        "properties": {
            "object": {"dataType":"string","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"LLMModelData"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorResponseDto": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "error": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMCompletionMessage": {
        "dataType": "refObject",
        "properties": {
            "role": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
            "name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMCompletionResponseChoice": {
        "dataType": "refObject",
        "properties": {
            "index": {"dataType":"double","required":true},
            "message": {"ref":"LLMCompletionMessage","required":true},
            "finish_reason": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMCompletionResponseUsage": {
        "dataType": "refObject",
        "properties": {
            "prompt_tokens": {"dataType":"double","required":true},
            "completion_tokens": {"dataType":"double","required":true},
            "total_tokens": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMCompletionResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "object": {"dataType":"string","required":true},
            "created": {"dataType":"double","required":true},
            "model": {"dataType":"string","required":true},
            "choices": {"dataType":"array","array":{"dataType":"refObject","ref":"LLMCompletionResponseChoice"},"required":true},
            "usage": {"ref":"LLMCompletionResponseUsage","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMCompletionRequestDto": {
        "dataType": "refObject",
        "properties": {
            "model": {"dataType":"string","required":true},
            "messages": {"dataType":"array","array":{"dataType":"refObject","ref":"LLMCompletionMessage"},"required":true},
            "temperature": {"dataType":"double"},
            "top_p": {"dataType":"double"},
            "n": {"dataType":"double"},
            "stream": {"dataType":"boolean"},
            "stop": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"string"}}]},
            "max_tokens": {"dataType":"double"},
            "presence_penalty": {"dataType":"double"},
            "frequency_penalty": {"dataType":"double"},
            "user": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMProvider": {
        "dataType": "refEnum",
        "enums": ["openai","anthropic","google","groq","cohere","deepseek","mistral","amazon","azure","fireworks","togetherai","perplexity","deepinfra","xai","ollama","huggingface","cerebras","elevenlabs","gladia","assemblyai","revai","deepgram","lmnt","hume","openrouter","custom"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderModelsResponseDto": {
        "dataType": "refObject",
        "properties": {
            "provider": {"ref":"LLMProvider","required":true},
            "provider_display_name": {"dataType":"string","required":true},
            "models": {"dataType":"array","array":{"dataType":"refObject","ref":"LLMModelData"},"required":true},
            "last_updated": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AllProviderModelsResponseDto": {
        "dataType": "refObject",
        "properties": {
            "providers": {"dataType":"array","array":{"dataType":"refObject","ref":"ProviderModelsResponseDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CustomProviderConfig": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "endpoint_url": {"dataType":"string","required":true},
            "api_key_env_var": {"dataType":"string","required":true},
            "models": {"dataType":"array","array":{"dataType":"refObject","ref":"LLMModelData"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TokenValidationResult": {
        "dataType": "refObject",
        "properties": {
            "valid": {"dataType":"boolean","required":true},
            "messageContentEnabled": {"dataType":"boolean","required":true},
            "botId": {"dataType":"string"},
            "username": {"dataType":"string"},
            "error": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderConfiguration": {
        "dataType": "refObject",
        "properties": {
            "enabled": {"dataType":"boolean","required":true},
            "config": {"ref":"Record_string.any_"},
            "custom_providers": {"dataType":"array","array":{"dataType":"refObject","ref":"CustomProviderConfig"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_LLMProvider.ProviderConfiguration_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"openai":{"ref":"ProviderConfiguration","required":true},"anthropic":{"ref":"ProviderConfiguration","required":true},"google":{"ref":"ProviderConfiguration","required":true},"groq":{"ref":"ProviderConfiguration","required":true},"cohere":{"ref":"ProviderConfiguration","required":true},"deepseek":{"ref":"ProviderConfiguration","required":true},"mistral":{"ref":"ProviderConfiguration","required":true},"amazon":{"ref":"ProviderConfiguration","required":true},"azure":{"ref":"ProviderConfiguration","required":true},"fireworks":{"ref":"ProviderConfiguration","required":true},"togetherai":{"ref":"ProviderConfiguration","required":true},"perplexity":{"ref":"ProviderConfiguration","required":true},"deepinfra":{"ref":"ProviderConfiguration","required":true},"xai":{"ref":"ProviderConfiguration","required":true},"ollama":{"ref":"ProviderConfiguration","required":true},"huggingface":{"ref":"ProviderConfiguration","required":true},"cerebras":{"ref":"ProviderConfiguration","required":true},"elevenlabs":{"ref":"ProviderConfiguration","required":true},"gladia":{"ref":"ProviderConfiguration","required":true},"assemblyai":{"ref":"ProviderConfiguration","required":true},"revai":{"ref":"ProviderConfiguration","required":true},"deepgram":{"ref":"ProviderConfiguration","required":true},"lmnt":{"ref":"ProviderConfiguration","required":true},"hume":{"ref":"ProviderConfiguration","required":true},"openrouter":{"ref":"ProviderConfiguration","required":true},"custom":{"ref":"ProviderConfiguration","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderRegistryConfiguration": {
        "dataType": "refObject",
        "properties": {
            "providers": {"ref":"Record_LLMProvider.ProviderConfiguration_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMResponse": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
            "generateImage": {"dataType":"boolean"},
            "imagePrompt": {"dataType":"string"},
            "toolCalls": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"content":{"dataType":"string"},"type":{"dataType":"string"},"arguments":{"dataType":"any","required":true},"name":{"dataType":"string","required":true}}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KnowledgeItemDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"}],"required":true},
            "title": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
            "priority": {"dataType":"double","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KnowledgeBaseResponseDto": {
        "dataType": "refObject",
        "properties": {
            "botId": {"dataType":"string","required":true},
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"KnowledgeItemDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageResponseDto": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "success": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "discordId": {"dataType":"string","required":true},
            "username": {"dataType":"string","required":true},
            "discriminator": {"dataType":"string","required":true},
            "avatar": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "bots": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserProfileResponseDto": {
        "dataType": "refObject",
        "properties": {
            "user": {"ref":"UserResponseDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BotStatus": {
        "dataType": "refEnum",
        "enums": ["offline","online","error","starting","stopping"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KnowledgeBase": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
            "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["text"]},{"dataType":"enum","enums":["file"]}],"required":true},
            "source": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImageProvider": {
        "dataType": "refEnum",
        "enums": ["openai","stability","midjourney"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImageGenerationConfig": {
        "dataType": "refObject",
        "properties": {
            "enabled": {"dataType":"boolean","required":true},
            "provider": {"ref":"ImageProvider","required":true},
            "apiKey": {"dataType":"string"},
            "model": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ToolParameter": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "required": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Tool": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "parameters": {"dataType":"array","array":{"dataType":"refObject","ref":"ToolParameter"},"required":true},
            "implementation": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BotConfiguration": {
        "dataType": "refObject",
        "properties": {
            "systemPrompt": {"dataType":"string","required":true},
            "personality": {"dataType":"string","required":true},
            "traits": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "backstory": {"dataType":"string","required":true},
            "llmProvider": {"ref":"LLMProvider","required":true},
            "llmModel": {"dataType":"string","required":true},
            "apiKey": {"dataType":"string","required":true},
            "knowledge": {"dataType":"array","array":{"dataType":"refObject","ref":"KnowledgeBase"},"required":true},
            "imageGeneration": {"ref":"ImageGenerationConfig","required":true},
            "toolsEnabled": {"dataType":"boolean","required":true},
            "tools": {"dataType":"array","array":{"dataType":"refObject","ref":"Tool"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BotResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "discordToken": {"dataType":"string"},
            "applicationId": {"dataType":"string","required":true},
            "status": {"ref":"BotStatus","required":true},
            "intents": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "configuration": {"ref":"BotConfiguration","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetAllBotsResponseDto": {
        "dataType": "refObject",
        "properties": {
            "bots": {"dataType":"array","array":{"dataType":"refObject","ref":"BotResponseDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetBotResponseDto": {
        "dataType": "refObject",
        "properties": {
            "bot": {"ref":"BotResponseDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateBotResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "discordToken": {"dataType":"string"},
            "applicationId": {"dataType":"string","required":true},
            "status": {"ref":"BotStatus","required":true},
            "intents": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "configuration": {"ref":"BotConfiguration","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateBotRequestDto": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "discordToken": {"dataType":"string","required":true},
            "applicationId": {"dataType":"string"},
            "intents": {"dataType":"array","array":{"dataType":"string"}},
            "configuration": {"ref":"BotConfiguration"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateBotResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "discordToken": {"dataType":"string"},
            "applicationId": {"dataType":"string","required":true},
            "status": {"ref":"BotStatus","required":true},
            "intents": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "configuration": {"ref":"BotConfiguration","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateBotRequestDto": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "discordToken": {"dataType":"string"},
            "applicationId": {"dataType":"string"},
            "intents": {"dataType":"array","array":{"dataType":"string"}},
            "status": {"ref":"BotStatus"},
            "configuration": {"ref":"BotConfiguration"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteBotResponseDto": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "success": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StartBotResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "discordToken": {"dataType":"string"},
            "applicationId": {"dataType":"string","required":true},
            "status": {"ref":"BotStatus","required":true},
            "intents": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "configuration": {"ref":"BotConfiguration","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StopBotResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "discordToken": {"dataType":"string"},
            "applicationId": {"dataType":"string","required":true},
            "status": {"ref":"BotStatus","required":true},
            "intents": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "configuration": {"ref":"BotConfiguration","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateBotConfigurationResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "discordToken": {"dataType":"string"},
            "applicationId": {"dataType":"string","required":true},
            "status": {"ref":"BotStatus","required":true},
            "intents": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "configuration": {"ref":"BotConfiguration","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateBotConfigurationRequestDto": {
        "dataType": "refObject",
        "properties": {
            "configuration": {"ref":"BotConfiguration","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenerateBotInviteLinkResponseDto": {
        "dataType": "refObject",
        "properties": {
            "inviteUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BotStatusConstants": {
        "dataType": "refObject",
        "properties": {
            "OFFLINE": {"dataType":"string","required":true},
            "ONLINE": {"dataType":"string","required":true},
            "ERROR": {"dataType":"string","required":true},
            "LABELS": {"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true},"online":{"dataType":"string","required":true},"offline":{"dataType":"string","required":true}},"required":true},
            "COLORS": {"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true},"online":{"dataType":"string","required":true},"offline":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LlmProviderConstants": {
        "dataType": "refObject",
        "properties": {
            "OPENAI": {"dataType":"string","required":true},
            "ANTHROPIC": {"dataType":"string","required":true},
            "GOOGLE": {"dataType":"string","required":true},
            "GROQ": {"dataType":"string","required":true},
            "COHERE": {"dataType":"string","required":true},
            "DEEPSEEK": {"dataType":"string","required":true},
            "MISTRAL": {"dataType":"string","required":true},
            "AMAZON": {"dataType":"string","required":true},
            "AZURE": {"dataType":"string","required":true},
            "FIREWORKS": {"dataType":"string","required":true},
            "TOGETHERAI": {"dataType":"string","required":true},
            "PERPLEXITY": {"dataType":"string","required":true},
            "DEEPINFRA": {"dataType":"string","required":true},
            "XAI": {"dataType":"string","required":true},
            "OLLAMA": {"dataType":"string","required":true},
            "HUGGINGFACE": {"dataType":"string","required":true},
            "CEREBRAS": {"dataType":"string","required":true},
            "ELEVENLABS": {"dataType":"string","required":true},
            "GLADIA": {"dataType":"string","required":true},
            "ASSEMBLYAI": {"dataType":"string","required":true},
            "REVAI": {"dataType":"string","required":true},
            "DEEPGRAM": {"dataType":"string","required":true},
            "LMNT": {"dataType":"string","required":true},
            "HUME": {"dataType":"string","required":true},
            "OPENROUTER": {"dataType":"string","required":true},
            "CUSTOM": {"dataType":"string","required":true},
            "LABELS": {"dataType":"nestedObjectLiteral","nestedProperties":{"custom":{"dataType":"string","required":true},"openrouter":{"dataType":"string","required":true},"hume":{"dataType":"string","required":true},"lmnt":{"dataType":"string","required":true},"deepgram":{"dataType":"string","required":true},"revai":{"dataType":"string","required":true},"assemblyai":{"dataType":"string","required":true},"gladia":{"dataType":"string","required":true},"elevenlabs":{"dataType":"string","required":true},"cerebras":{"dataType":"string","required":true},"huggingface":{"dataType":"string","required":true},"ollama":{"dataType":"string","required":true},"xai":{"dataType":"string","required":true},"deepinfra":{"dataType":"string","required":true},"perplexity":{"dataType":"string","required":true},"togetherai":{"dataType":"string","required":true},"fireworks":{"dataType":"string","required":true},"azure":{"dataType":"string","required":true},"amazon":{"dataType":"string","required":true},"mistral":{"dataType":"string","required":true},"deepseek":{"dataType":"string","required":true},"cohere":{"dataType":"string","required":true},"groq":{"dataType":"string","required":true},"google":{"dataType":"string","required":true},"anthropic":{"dataType":"string","required":true},"openai":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImageProviderConstants": {
        "dataType": "refObject",
        "properties": {
            "OPENAI": {"dataType":"string","required":true},
            "STABILITY": {"dataType":"string","required":true},
            "MIDJOURNEY": {"dataType":"string","required":true},
            "LABELS": {"dataType":"nestedObjectLiteral","nestedProperties":{"midjourney":{"dataType":"string","required":true},"stability":{"dataType":"string","required":true},"openai":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HttpStatusConstants": {
        "dataType": "refObject",
        "properties": {
            "OK": {"dataType":"double","required":true},
            "CREATED": {"dataType":"double","required":true},
            "BAD_REQUEST": {"dataType":"double","required":true},
            "UNAUTHORIZED": {"dataType":"double","required":true},
            "FORBIDDEN": {"dataType":"double","required":true},
            "NOT_FOUND": {"dataType":"double","required":true},
            "INTERNAL_SERVER_ERROR": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StorageKeysConstants": {
        "dataType": "refObject",
        "properties": {
            "AUTH_STORAGE": {"dataType":"string","required":true},
            "USER_PREFERENCES": {"dataType":"string","required":true},
            "THEME_MODE": {"dataType":"string","required":true},
            "AUTH_TOKEN": {"dataType":"string","required":true},
            "USER_PROFILE": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultsConstants": {
        "dataType": "refObject",
        "properties": {
            "BOT": {"dataType":"nestedObjectLiteral","nestedProperties":{"LLM_MODEL":{"dataType":"string","required":true},"LLM_PROVIDER":{"dataType":"string","required":true},"TRAITS":{"dataType":"array","array":{"dataType":"string"},"required":true},"PERSONALITY":{"dataType":"string","required":true},"SYSTEM_PROMPT":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EnvVarsConstants": {
        "dataType": "refObject",
        "properties": {
            "API_URL": {"dataType":"string","required":true},
            "NODE_ENV": {"dataType":"string","required":true},
            "PORT": {"dataType":"string","required":true},
            "DB_PATH": {"dataType":"string","required":true},
            "JWT_SECRET": {"dataType":"string","required":true},
            "DISCORD_CLIENT_ID": {"dataType":"string","required":true},
            "DISCORD_CLIENT_SECRET": {"dataType":"string","required":true},
            "DISCORD_CALLBACK_URL": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DiscordApiConstants": {
        "dataType": "refObject",
        "properties": {
            "BASE_URL": {"dataType":"string","required":true},
            "OAUTH2_URL": {"dataType":"string","required":true},
            "PERMISSIONS": {"dataType":"nestedObjectLiteral","nestedProperties":{"EMBED_LINKS":{"dataType":"string","required":true},"ATTACH_FILES":{"dataType":"string","required":true},"READ_MESSAGE_HISTORY":{"dataType":"string","required":true},"VIEW_CHANNEL":{"dataType":"string","required":true},"SEND_MESSAGES":{"dataType":"string","required":true}},"required":true},
            "SCOPES": {"dataType":"nestedObjectLiteral","nestedProperties":{"APPLICATIONS_COMMANDS":{"dataType":"string","required":true},"BOT":{"dataType":"string","required":true}},"required":true},
            "PERMISSION_INTEGERS": {"dataType":"nestedObjectLiteral","nestedProperties":{"BASIC_BOT":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Constants": {
        "dataType": "refObject",
        "properties": {
            "BOT_STATUS": {"ref":"BotStatusConstants","required":true},
            "LLM_PROVIDER": {"ref":"LlmProviderConstants","required":true},
            "IMAGE_PROVIDER": {"ref":"ImageProviderConstants","required":true},
            "HTTP_STATUS": {"ref":"HttpStatusConstants","required":true},
            "STORAGE_KEYS": {"ref":"StorageKeysConstants","required":true},
            "DEFAULTS": {"ref":"DefaultsConstants","required":true},
            "ENV_VARS": {"ref":"EnvVarsConstants","required":true},
            "DISCORD_API": {"ref":"DiscordApiConstants","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConstantsResponseDto": {
        "dataType": "refObject",
        "properties": {
            "constants": {"ref":"Constants","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsToolController_getToolsByBotId: Record<string, TsoaRoute.ParameterSchema> = {
                botId: {"in":"path","name":"botId","required":true,"dataType":"string"},
        };
        app.get('/tools/:botId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.getToolsByBotId)),

            async function ToolController_getToolsByBotId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_getToolsByBotId, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'getToolsByBotId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolController_getEnabledToolsByBotId: Record<string, TsoaRoute.ParameterSchema> = {
                botId: {"in":"path","name":"botId","required":true,"dataType":"string"},
        };
        app.get('/tools/:botId/enabled',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.getEnabledToolsByBotId)),

            async function ToolController_getEnabledToolsByBotId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_getEnabledToolsByBotId, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'getEnabledToolsByBotId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolController_getToolById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/tools/detail/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.getToolById)),

            async function ToolController_getToolById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_getToolById, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'getToolById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolController_createTool: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"body","name":"request","required":true,"ref":"CreateToolRequest"},
        };
        app.post('/tools',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.createTool)),

            async function ToolController_createTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_createTool, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'createTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolController_updateTool: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                request: {"in":"body","name":"request","required":true,"ref":"UpdateToolRequest"},
        };
        app.put('/tools/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.updateTool)),

            async function ToolController_updateTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_updateTool, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'updateTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolController_toggleToolStatus: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                request: {"in":"body","name":"request","required":true,"ref":"ToggleToolStatusRequest"},
        };
        app.put('/tools/:id/toggle',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.toggleToolStatus)),

            async function ToolController_toggleToolStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_toggleToolStatus, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'toggleToolStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolController_deleteTool: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/tools/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.deleteTool)),

            async function ToolController_deleteTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_deleteTool, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'deleteTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolController_deleteAllToolsForBot: Record<string, TsoaRoute.ParameterSchema> = {
                botId: {"in":"path","name":"botId","required":true,"dataType":"string"},
        };
        app.delete('/tools/bot/:botId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolController)),
            ...(fetchMiddlewares<RequestHandler>(ToolController.prototype.deleteAllToolsForBot)),

            async function ToolController_deleteAllToolsForBot(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolController_deleteAllToolsForBot, request, response });

                const controller = new ToolController();

              await templateService.apiHandler({
                methodName: 'deleteAllToolsForBot',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_getModels: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/llm/models',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.getModels)),

            async function LLMController_getModels(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_getModels, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'getModels',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_createChatCompletion: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"LLMCompletionRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/llm/chat/completions',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.createChatCompletion)),

            async function LLMController_createChatCompletion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_createChatCompletion, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'createChatCompletion',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_getProviders: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/llm/providers',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.getProviders)),

            async function LLMController_getProviders(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_getProviders, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'getProviders',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_checkProviderAvailability: Record<string, TsoaRoute.ParameterSchema> = {
                provider: {"in":"path","name":"provider","required":true,"ref":"LLMProvider"},
        };
        app.get('/llm/providers/:provider',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.checkProviderAvailability)),

            async function LLMController_checkProviderAvailability(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_checkProviderAvailability, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'checkProviderAvailability',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_getProviderModels: Record<string, TsoaRoute.ParameterSchema> = {
                provider: {"in":"path","name":"provider","required":true,"ref":"LLMProvider"},
        };
        app.get('/llm/providers/:provider/models',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.getProviderModels)),

            async function LLMController_getProviderModels(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_getProviderModels, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'getProviderModels',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_getAllProviderModels: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/llm/models/all-providers',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.getAllProviderModels)),

            async function LLMController_getAllProviderModels(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_getAllProviderModels, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'getAllProviderModels',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_refreshProviderModels: Record<string, TsoaRoute.ParameterSchema> = {
                provider: {"in":"path","name":"provider","required":true,"ref":"LLMProvider"},
        };
        app.post('/llm/providers/:provider/models/refresh',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.refreshProviderModels)),

            async function LLMController_refreshProviderModels(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_refreshProviderModels, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'refreshProviderModels',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_updateProviderStatus: Record<string, TsoaRoute.ParameterSchema> = {
                provider: {"in":"path","name":"provider","required":true,"ref":"LLMProvider"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"enabled":{"dataType":"boolean","required":true}}},
        };
        app.put('/llm/providers/:provider/status',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.updateProviderStatus)),

            async function LLMController_updateProviderStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_updateProviderStatus, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'updateProviderStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_configureCustomProvider: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CustomProviderConfig"},
        };
        app.post('/llm/providers/custom',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.configureCustomProvider)),

            async function LLMController_configureCustomProvider(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_configureCustomProvider, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'configureCustomProvider',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_removeCustomProvider: Record<string, TsoaRoute.ParameterSchema> = {
                name: {"in":"path","name":"name","required":true,"dataType":"string"},
        };
        app.delete('/llm/providers/custom/:name',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.removeCustomProvider)),

            async function LLMController_removeCustomProvider(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_removeCustomProvider, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'removeCustomProvider',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_exposeInternalTypesForTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"providerConfig":{"ref":"ProviderConfiguration","required":true},"providerRegistry":{"ref":"ProviderRegistryConfiguration","required":true},"tokenValidation":{"ref":"TokenValidationResult","required":true}}},
        };
        app.post('/llm/internal/types-exposure',
            authenticateMiddleware([{"jwt":["admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.exposeInternalTypesForTsoa)),

            async function LLMController_exposeInternalTypesForTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_exposeInternalTypesForTsoa, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'exposeInternalTypesForTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLLMController_getDirectLLMResponse: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"model":{"dataType":"string"},"prompt":{"dataType":"string","required":true},"provider":{"ref":"LLMProvider","required":true}}},
        };
        app.post('/llm/direct-response',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LLMController)),
            ...(fetchMiddlewares<RequestHandler>(LLMController.prototype.getDirectLLMResponse)),

            async function LLMController_getDirectLLMResponse(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMController_getDirectLLMResponse, request, response });

                const controller = new LLMController();

              await templateService.apiHandler({
                methodName: 'getDirectLLMResponse',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsKnowledgeController_getKnowledgeItems: Record<string, TsoaRoute.ParameterSchema> = {
                botId: {"in":"path","name":"botId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/bots/:botId/knowledge',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController)),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController.prototype.getKnowledgeItems)),

            async function KnowledgeController_getKnowledgeItems(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsKnowledgeController_getKnowledgeItems, request, response });

                const controller = new KnowledgeController();

              await templateService.apiHandler({
                methodName: 'getKnowledgeItems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsKnowledgeController_addKnowledgeItem: Record<string, TsoaRoute.ParameterSchema> = {
                botId: {"in":"path","name":"botId","required":true,"dataType":"string"},
                item: {"in":"body","name":"item","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"priority":{"dataType":"double"},"type":{"dataType":"string","required":true},"content":{"dataType":"string","required":true},"title":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/bots/:botId/knowledge',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController)),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController.prototype.addKnowledgeItem)),

            async function KnowledgeController_addKnowledgeItem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsKnowledgeController_addKnowledgeItem, request, response });

                const controller = new KnowledgeController();

              await templateService.apiHandler({
                methodName: 'addKnowledgeItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsKnowledgeController_updateKnowledgeItem: Record<string, TsoaRoute.ParameterSchema> = {
                botId: {"in":"path","name":"botId","required":true,"dataType":"string"},
                itemId: {"in":"path","name":"itemId","required":true,"dataType":"string"},
                item: {"in":"body","name":"item","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"priority":{"dataType":"double"},"type":{"dataType":"string"},"content":{"dataType":"string"},"title":{"dataType":"string"}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/bots/:botId/knowledge/:itemId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController)),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController.prototype.updateKnowledgeItem)),

            async function KnowledgeController_updateKnowledgeItem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsKnowledgeController_updateKnowledgeItem, request, response });

                const controller = new KnowledgeController();

              await templateService.apiHandler({
                methodName: 'updateKnowledgeItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsKnowledgeController_deleteKnowledgeItem: Record<string, TsoaRoute.ParameterSchema> = {
                botId: {"in":"path","name":"botId","required":true,"dataType":"string"},
                itemId: {"in":"path","name":"itemId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/bots/:botId/knowledge/:itemId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController)),
            ...(fetchMiddlewares<RequestHandler>(KnowledgeController.prototype.deleteKnowledgeItem)),

            async function KnowledgeController_deleteKnowledgeItem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsKnowledgeController_deleteKnowledgeItem, request, response });

                const controller = new KnowledgeController();

              await templateService.apiHandler({
                methodName: 'deleteKnowledgeItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_register: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/auth/register',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.register)),

            async function AuthController_register(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_register, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'register',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getProfile: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/auth/profile',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getProfile)),

            async function AuthController_getProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getProfile, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_logout: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/auth/logout',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.logout)),

            async function AuthController_logout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_logout, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'logout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_getUserBots: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/bots',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.getUserBots)),

            async function BotController_getUserBots(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_getUserBots, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'getUserBots',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_getBotById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/bots/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.getBotById)),

            async function BotController_getBotById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_getBotById, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'getBotById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_createBot: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateBotRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/bots',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.createBot)),

            async function BotController_createBot(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_createBot, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'createBot',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_updateBot: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateBotRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/bots/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.updateBot)),

            async function BotController_updateBot(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_updateBot, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'updateBot',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_deleteBot: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/bots/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.deleteBot)),

            async function BotController_deleteBot(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_deleteBot, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'deleteBot',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_startBotById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/bots/:id/start',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.startBotById)),

            async function BotController_startBotById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_startBotById, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'startBotById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_stopBotById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/bots/:id/stop',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.stopBotById)),

            async function BotController_stopBotById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_stopBotById, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'stopBotById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_updateBotConfiguration: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateBotConfigurationRequestDto"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/bots/:id/configuration',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.updateBotConfiguration)),

            async function BotController_updateBotConfiguration(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_updateBotConfiguration, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'updateBotConfiguration',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_generateInviteLink: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/bots/:id/invite',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.generateInviteLink)),

            async function BotController_generateInviteLink(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_generateInviteLink, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'generateInviteLink',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBotController_validateToken: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"string","required":true}}},
        };
        app.post('/bots/validate-token',
            ...(fetchMiddlewares<RequestHandler>(BotController)),
            ...(fetchMiddlewares<RequestHandler>(BotController.prototype.validateToken)),

            async function BotController_validateToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBotController_validateToken, request, response });

                const controller = new BotController();

              await templateService.apiHandler({
                methodName: 'validateToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsConstantsController_getConstants: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/constants',
            ...(fetchMiddlewares<RequestHandler>(ConstantsController)),
            ...(fetchMiddlewares<RequestHandler>(ConstantsController.prototype.getConstants)),

            async function ConstantsController_getConstants(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsConstantsController_getConstants, request, response });

                const controller = new ConstantsController();

              await templateService.apiHandler({
                methodName: 'getConstants',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
