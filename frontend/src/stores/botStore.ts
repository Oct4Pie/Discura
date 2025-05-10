import { create } from 'zustand';
import { FrontendBot, toBotModel, toBotModels, BotConfiguration } from '../types';
import { BotsService } from '../api';
import { CreateBotRequest } from '../api';
import { UpdateBotRequest } from '../api';

interface BotsState {
  bots: FrontendBot[];
  currentBot: FrontendBot | null;
  isLoading: boolean;
  error: string | null;
  
  fetchBots: () => Promise<void>;
  fetchBot: (id: string) => Promise<void>;
  createBot: (botData: Partial<FrontendBot>) => Promise<FrontendBot>;
  updateBot: (id: string, botData: Partial<FrontendBot>) => Promise<FrontendBot>;
  deleteBot: (id: string) => Promise<void>;
  startBot: (id: string) => Promise<FrontendBot>;
  stopBot: (id: string) => Promise<FrontendBot>;
  updateBotConfiguration: (id: string, config: Partial<BotConfiguration>) => Promise<FrontendBot>;
}

export const useBotStore = create<BotsState>((set, get) => ({
  bots: [],
  currentBot: null,
  isLoading: false,
  error: null,
  
  fetchBots: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Call directly to the API endpoint since getUserBots is not in the generated API
      // The GET / route is supposed to return the list of bots for the current user
      const response = await fetch('/api/bots');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set({ bots: toBotModels(data.bots), isLoading: false });
    } catch (error) {
      console.error('Error fetching bots:', error);
      set({ error: 'Failed to fetch bots', isLoading: false });
    }
  },
  
  fetchBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await BotsService.getBotById(id);
      set({ currentBot: toBotModel(response.bot), isLoading: false });
    } catch (error) {
      console.error(`Error fetching bot ${id}:`, error);
      set({ error: 'Failed to fetch bot details', isLoading: false });
    }
  },
  
  createBot: async (botData: Partial<FrontendBot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await BotsService.createBot(botData as CreateBotRequest);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: [...state.bots, bot],
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error('Error creating bot:', error);
      set({ error: 'Failed to create bot', isLoading: false });
      throw error;
    }
  },
  
  updateBot: async (id: string, botData: Partial<FrontendBot>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await BotsService.updateBot(id, botData as UpdateBotRequest);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: state.bots.map((b: FrontendBot) => b.id === id ? bot : b),
        currentBot: state.currentBot?.id === id ? bot : state.currentBot,
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error(`Error updating bot ${id}:`, error);
      set({ error: 'Failed to update bot', isLoading: false });
      throw error;
    }
  },
  
  deleteBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      await BotsService.deleteBot(id);
      
      set(state => ({
        bots: state.bots.filter((bot: FrontendBot) => bot.id !== id),
        currentBot: state.currentBot?.id === id ? null : state.currentBot,
        isLoading: false
      }));
    } catch (error) {
      console.error(`Error deleting bot ${id}:`, error);
      set({ error: 'Failed to delete bot', isLoading: false });
      throw error;
    }
  },
  
  startBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await BotsService.startBotById(id);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: state.bots.map((b: FrontendBot) => b.id === id ? bot : b),
        currentBot: state.currentBot?.id === id ? bot : state.currentBot,
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error(`Error starting bot ${id}:`, error);
      set({ error: 'Failed to start bot', isLoading: false });
      throw error;
    }
  },
  
  stopBot: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the generated API service
      const response = await BotsService.stopBotById(id);
      const bot = toBotModel(response);
      
      set(state => ({
        bots: state.bots.map((b: FrontendBot) => b.id === id ? bot : b),
        currentBot: state.currentBot?.id === id ? bot : state.currentBot,
        isLoading: false
      }));
      
      return bot;
    } catch (error) {
      console.error(`Error stopping bot ${id}:`, error);
      set({ error: 'Failed to stop bot', isLoading: false });
      throw error;
    }
  },
  
  updateBotConfiguration: async (id: string, config: Partial<BotConfiguration>) => {
    const currentBot = get().currentBot;
    
    if (!currentBot) {
      throw new Error('No bot is currently selected');
    }
    
    const updatedConfig = {
      ...currentBot.configuration,
      ...config
    };
    
    return get().updateBot(id, { configuration: updatedConfig as any });
  }
}));
