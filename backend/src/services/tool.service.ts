import { Tool } from "@discura/common";
import { logger } from "../utils/logger";
import { BotAdapter } from "../models/adapters/bot.adapter";

// Execute tool calls
export const executeTools = async (
  toolCalls: any[],
  availableTools: Tool[]
): Promise<any[]> => {
  const results = [];

  for (const call of toolCalls) {
    try {
      // Find the tool by name
      const tool = availableTools.find((t) => t.name === call.name);

      if (!tool) {
        results.push({ error: `Tool "${call.name}" not found` });
        continue;
      }

      // Execute the tool
      const result = await executeTool(tool, call.arguments);
      results.push(result);
    } catch (error) {
      logger.error(`Error executing tool ${call.name}:`, error);
      results.push({
        error: `Error executing tool: ${(error as Error).message}`,
      });
    }
  }

  return results;
};

// Execute a single tool with arguments
const executeTool = async (tool: Tool, args: any): Promise<any> => {
  try {
    // Check if all required parameters are provided
    for (const param of tool.parameters) {
      if (
        param.required &&
        (args[param.name] === undefined || args[param.name] === null)
      ) {
        return { error: `Required parameter "${param.name}" is missing` };
      }
    }

    // Create a safe execution environment
    const executionContext = {
      args,
      result: null,
      console: {
        log: (...args: any[]) => logger.info(`Tool ${tool.name} log:`, ...args),
        error: (...args: any[]) =>
          logger.error(`Tool ${tool.name} error:`, ...args),
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

    return result || { success: true, message: "Tool executed successfully" };
  } catch (error) {
    logger.error(`Error in tool execution for ${tool.name}:`, error);
    return { error: `Failed to execute tool: ${(error as Error).message}` };
  }
};

/**
 * Evaluate tool execution results in the context of the original call
 * @param toolResult Result from tool execution
 * @param originalCall Original tool call that was executed
 */
export const evaluateToolResult = (toolResult: any, originalCall: any): any => {
  try {
    // Implement the tool evaluation logic here
    logger.info(
      `Evaluating tool result for ${originalCall?.name || "unknown tool"}`
    );

    // Basic evaluation implementation
    if (toolResult.error) {
      return {
        success: false,
        error: toolResult.error,
        toolName: originalCall?.name,
        message: `The tool ${originalCall?.name || "unknown"} encountered an error: ${toolResult.error}`,
      };
    }

    return {
      success: true,
      result: toolResult,
      toolName: originalCall?.name,
      message: `The tool ${originalCall?.name || "unknown"} executed successfully`,
    };
  } catch (error) {
    logger.error("Error evaluating tool result:", error);
    return {
      success: false,
      error: `Failed to evaluate tool result: ${(error as Error).message}`,
      toolName: originalCall?.name,
    };
  }
};

/**
 * Find tools that match the given message based on their descriptions and triggers
 * @param message User message to match against tools
 * @param availableTools List of available tools to search through
 * @returns List of matching tools
 */
export const findMatchingTools = (
  message: string,
  availableTools: Tool[]
): Tool[] => {
  try {
    // Implement more sophisticated tool matching logic here
    logger.info(
      `Finding tools that match message: "${message.substring(0, 20)}..."`
    );

    // Basic implementation that extends the stub from the common package
    return availableTools.filter((tool) => {
      // Check if the message contains keywords from tool description or name
      const keywords = [
        ...tool.name.toLowerCase().split(/[^a-z0-9]/),
        ...tool.description.toLowerCase().split(/[^a-z0-9]/),
      ].filter((kw) => kw.length > 3); // Only use keywords longer than 3 chars

      return keywords.some((keyword) =>
        message.toLowerCase().includes(keyword)
      );
    });
  } catch (error) {
    logger.error("Error finding matching tools:", error);
    return [];
  }
};

/**
 * Process a tool command invocation from a slash command
 * @param botId The ID of the bot
 * @param toolName The name of the tool to execute
 * @param toolInput The input to pass to the tool (usually JSON string)
 * @returns Formatted result message
 */
export const processToolCommand = async (
  botId: string,
  toolName: string,
  toolInput: string
): Promise<string> => {
  try {
    logger.info(`Processing tool command: ${toolName} for bot ${botId}`);

    const bot = await BotAdapter.findById(botId);

    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }

    if (!bot.configuration?.toolsEnabled) {
      throw new Error("Tools are not enabled for this bot");
    }

    // Find the requested tool
    const tool = bot.configuration.tools?.find(
      (t: { name: string; id: string }) =>
        t.name === toolName || t.id === toolName
    );

    if (!tool) {
      throw new Error(`Tool "${toolName}" not found for this bot`);
    }

    // Parse the input as arguments
    let args: Record<string, any> = {};

    if (toolInput) {
      try {
        // First try to parse as JSON
        args = JSON.parse(toolInput);
      } catch (parseError) {
        // If not valid JSON, treat as a simple string input
        // Find the first parameter that's required and use the input as its value
        const firstParam = tool.parameters.find(
          (p: { required: boolean; name: string }) => p.required
        );
        if (firstParam) {
          args[firstParam.name] = toolInput;
        } else if (tool.parameters.length > 0) {
          // Or use the first parameter if none are required
          args[tool.parameters[0].name] = toolInput;
        }
      }
    }

    // Execute the tool with the parsed arguments
    const result = await executeTool(tool, args);

    // Format the result for display
    if (result.error) {
      return `❌ Error executing tool ${toolName}: ${result.error}`;
    }

    if (typeof result === "object") {
      return `✅ Tool ${toolName} executed successfully:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
    }

    return `✅ Tool ${toolName} result: ${result}`;
  } catch (error) {
    logger.error(`Error processing tool command:`, error);
    return `❌ Error: ${(error as Error).message}`;
  }
};
