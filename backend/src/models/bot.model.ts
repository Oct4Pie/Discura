import { BotStatus } from "@discura/common";
import { Bot, BotAdapter } from "./adapters/bot.adapter";

// Re-export the Bot class and adapter for backward compatibility
export { Bot, BotAdapter };

// Export a default adapter for simpler imports
export default BotAdapter;
