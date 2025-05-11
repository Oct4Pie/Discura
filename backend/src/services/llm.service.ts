import axios from 'axios';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { 
  LLMCompletionRequestDto, 
  LLMCompletionResponseDto,
  LLMModelData
} from '@discura/common';
import { LLMResponse } from '@discura/common/types/llm';
import { BotAdapter } from '../models/adapters/bot.adapter';

// Default models to show when no provider is available
const DEFAULT_MODELS: LLMModelData[] = [
  {
    id: 'gpt-3.5-turbo',
    object: 'model',
    created: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    owned_by: 'openai'
  },
  {
    id: 'gpt-4',
    object: 'model',
    created: Math.floor(Date.now() / 1000) - 86400 * 60, // 60 days ago
    owned_by: 'openai'
  },
  {
    id: 'claude-3-opus-20240229',
    object: 'model',
    created: Math.floor(Date.now() / 1000) - 86400 * 15, // 15 days ago
    owned_by: 'anthropic'
  }
];

/**
 * Fetch available LLM models from the appropriate provider
 */
export const listModels = async (): Promise<LLMModelData[]> => {
  try {
    // In a real implementation, you might:
    // 1. Check for admin/system-wide API keys
    // 2. Allow per-user API keys
    // 3. Fetch from multiple providers
    
    // For simplicity, we'll just return default models for now
    // In a production app, you would use the API keys to fetch available models
    
    // NOTE: This would be the place to perform real model fetching:
    /*
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
    */
    
    return DEFAULT_MODELS;
  } catch (error) {
    logger.error('Error fetching LLM models:', error);
    return DEFAULT_MODELS; // Fall back to default models
  }
};

/**
 * Create a chat completion using the selected model
 */
export const createChatCompletion = async (
  request: LLMCompletionRequestDto,
  userId: string
): Promise<LLMCompletionResponseDto> => {
  try {
    // Get API key based on user or bot configuration
    const apiKey = await getApiKeyForUser(userId, request.model);
    
    if (apiKey) {
      // In a real implementation, make actual API call to the LLM provider
      // For now, we'll simulate a response
      
      // NOTE: This would be the place to make the real API call:
      /*
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        request,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
      */
    }
    
    // Simulate a response for demo purposes
    const completionText = generateSimulatedResponse(request.messages);
    
    return {
      id: `chatcmpl-${uuidv4().substring(0, 8)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: completionText
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: calculateTokenCount(request.messages.map((m: { content: string }) => m.content).join(' ')),
        completion_tokens: calculateTokenCount(completionText),
        total_tokens: calculateTokenCount(request.messages.map((m: { content: string }) => m.content).join(' ') + completionText)
      }
    };
  } catch (error) {
    logger.error('Error creating chat completion:', error);
    throw new Error('Failed to create chat completion');
  }
};

/**
 * Create a streaming chat completion
 */
export const createStreamingChatCompletion = (
  request: LLMCompletionRequestDto,
  userId: string,
  res: Response
): void => {
  try {
    const responseText = generateSimulatedResponse(request.messages);
    const words = responseText.split(' ');
    
    // Set up SSE stream
    res.write('data: ' + JSON.stringify({
      id: `chatcmpl-${uuidv4().substring(0, 8)}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [{
        index: 0,
        delta: {
          role: 'assistant'
        },
        finish_reason: null
      }]
    }) + '\n\n');
    
    // Stream the response word by word
    let wordIndex = 0;
    
    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        const word = words[wordIndex];
        res.write('data: ' + JSON.stringify({
          id: `chatcmpl-${uuidv4().substring(0, 8)}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: request.model,
          choices: [{
            index: 0,
            delta: {
              content: word + ' '
            },
            finish_reason: null
          }]
        }) + '\n\n');
        
        wordIndex++;
      } else {
        // Send the final chunk with finish_reason
        res.write('data: ' + JSON.stringify({
          id: `chatcmpl-${uuidv4().substring(0, 8)}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: request.model,
          choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop'
          }]
        }) + '\n\n');
        
        // End the stream
        res.write('data: [DONE]\n\n');
        clearInterval(interval);
        res.end();
      }
    }, 50); // Stream a new word every 50ms
    
    // Handle client disconnect
    res.on('close', () => {
      clearInterval(interval);
    });
  } catch (error) {
    logger.error('Error creating streaming chat completion:', error);
    res.write('data: ' + JSON.stringify({
      error: {
        message: 'Error creating streaming response',
        type: 'server_error'
      }
    }) + '\n\n');
    res.end();
  }
};

/**
 * Get the appropriate API key for the user and model
 */
async function getApiKeyForUser(userId: string, model: string): Promise<string | null> {
  try {
    // Find all bots for this user
    const userBots = await BotAdapter.findByUserId(userId);
    
    // Look for a bot with the appropriate configuration
    for (const bot of userBots) {
      if (bot.configuration?.apiKey && bot.configuration?.llmModel === model) {
        return bot.configuration.apiKey;
      }
    }
    
    // If no exact model match, return the first API key found
    for (const bot of userBots) {
      if (bot.configuration?.apiKey) {
        return bot.configuration.apiKey;
      }
    }
    
    // In a production app, you might have a fallback system-wide API key
    return null;
  } catch (error) {
    logger.error('Error getting API key:', error);
    return null;
  }
}

/**
 * Simple token counting estimation
 * Note: In a real app, you would use a proper tokenizer
 */
function calculateTokenCount(text: string): number {
  // Rough approximation, assumes ~4 chars per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Generate a simulated response for demo purposes
 */
function generateSimulatedResponse(messages: Array<{ role: string, content: string }>): string {
  // For demo purposes, just echo back something based on the last message
  const lastMessage = messages[messages.length - 1];
  
  // Simple response generation
  if (!lastMessage || !lastMessage.content) {
    return "I'm sorry, I don't understand your request.";
  }
  
  const content = lastMessage.content.toLowerCase();
  
  if (content.includes('hello') || content.includes('hi ')) {
    return "Hello there! How can I help you today?";
  } else if (content.includes('weather')) {
    return "I don't have real-time weather data, but I can tell you it's always sunny in the world of APIs!";
  } else if (content.includes('help')) {
    return "I'm here to help! You can ask me anything, and I'll do my best to assist you.";
  } else if (content.includes('model')) {
    return "I'm simulating different AI models. In a real implementation, I would use the model you selected to generate responses.";
  } else {
    return "Thank you for your message. This is a simulated response. In a production environment, the actual LLM model would process your request and generate a meaningful response based on your input.";
  }
}

// Call the LLM based on the specified provider
export const callLLM = async (request: {
  botId: string;
  prompt: string;
  userId: string;
  username: string;
}): Promise<LLMResponse> => {
  try {
    // Get bot configuration from database
    const bot = await BotAdapter.findById(request.botId);
    if (!bot || !bot.configuration) {
      logger.error(`Bot not found or missing configuration: ${request.botId}`);
      return {
        text: 'Sorry, I encountered an error with my configuration. Please try again later.'
      };
    }
    
    const { llmProvider, llmModel, apiKey } = bot.configuration;
    
    switch (llmProvider) {
      case 'openai':
        return await callOpenAI(request.prompt, llmModel, apiKey);
      case 'anthropic':
        return await callAnthropic(request.prompt, llmModel, apiKey);
      case 'google':
        return await callGoogle(request.prompt, llmModel, apiKey);
      case 'custom':
        return await callCustomLLM(request.prompt, llmModel, apiKey);
      default:
        // Default to OpenAI if provider is not recognized
        return await callOpenAI(request.prompt, 'gpt-3.5-turbo', apiKey);
    }
  } catch (error) {
    logger.error(`Error calling LLM for bot ${request.botId}:`, error);
    return {
      text: 'Sorry, I encountered an error connecting to my AI service. Please try again later.'
    };
  }
};

// Call OpenAI API
const callOpenAI = async (prompt: string, model: string, apiKey: string): Promise<LLMResponse> => {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      tool_choice: 'auto',
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_image',
            description: 'Generate an image based on a description',
            parameters: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The description of the image to generate'
                }
              },
              required: ['prompt']
            }
          }
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const responseMessage = response.data.choices[0].message;
  
  // Check for tool calls
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    return {
      text: responseMessage.content || 'I need to generate an image based on your request.',
      toolCalls: responseMessage.tool_calls.map((tool: any) => ({
        name: tool.function.name,
        arguments: JSON.parse(tool.function.arguments)
      }))
    };
  }
  
  return {
    text: responseMessage.content
  };
};

// Call Anthropic API
const callAnthropic = async (prompt: string, model: string, apiKey: string): Promise<LLMResponse> => {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: model || 'claude-3-sonnet-20240229',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    }
  );
  
  return {
    text: response.data.content[0].text
  };
};

// Call Google API (Gemini)
const callGoogle = async (prompt: string, model: string, apiKey: string): Promise<LLMResponse> => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/models/${model || 'gemini-pro'}:generateContent`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generation_config: {
        temperature: 0.7,
        max_output_tokens: 1000
      }
    },
    {
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        key: apiKey
      }
    }
  );
  
  return {
    text: response.data.candidates[0].content.parts[0].text
  };
};

// Call custom LLM API
const callCustomLLM = async (prompt: string, endpoint: string, apiKey: string): Promise<LLMResponse> => {
  const response = await axios.post(
    endpoint,
    {
      prompt,
      apiKey
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  
  return {
    text: response.data.response || response.data.text
  };
};
