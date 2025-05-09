import { Tool } from '@discura/common/types'; // Updated import path
import { logger } from '../utils/logger';

// Execute tool calls
export const executeTools = async (
  toolCalls: any[],
  availableTools: Tool[]
): Promise<any[]> => {
  const results = [];
  
  for (const call of toolCalls) {
    try {
      // Find the tool by name
      const tool = availableTools.find(t => t.name === call.name);
      
      if (!tool) {
        results.push({ error: `Tool "${call.name}" not found` });
        continue;
      }
      
      // Execute the tool
      const result = await executeTool(tool, call.arguments);
      results.push(result);
    } catch (error) {
      logger.error(`Error executing tool ${call.name}:`, error);
      results.push({ error: `Error executing tool: ${(error as Error).message}` });
    }
  }
  
  return results;
};

// Execute a single tool with arguments
const executeTool = async (tool: Tool, args: any): Promise<any> => {
  try {
    // Check if all required parameters are provided
    for (const param of tool.parameters) {
      if (param.required && (args[param.name] === undefined || args[param.name] === null)) {
        return { error: `Required parameter "${param.name}" is missing` };
      }
    }
    
    // Create a safe execution environment
    const executionContext = {
      args,
      result: null,
      console: {
        log: (...args: any[]) => logger.info(`Tool ${tool.name} log:`, ...args),
        error: (...args: any[]) => logger.error(`Tool ${tool.name} error:`, ...args)
      },
      fetch: global.fetch,
      // Add other safe APIs here
    };
    
    // Wrap the implementation code in an async function
    const wrappedCode = `
      return (async function() {
        try {
          ${tool.implementation}
        } catch (error) {
          return { error: error.message };
        }
      })();
    `;
    
    // Execute the code
    const func = new Function(...Object.keys(executionContext), wrappedCode);
    const result = await func(...Object.values(executionContext));
    
    return result || { success: true, message: 'Tool executed successfully' };
  } catch (error) {
    logger.error(`Error in tool execution for ${tool.name}:`, error);
    return { error: `Failed to execute tool: ${(error as Error).message}` };
  }
};
