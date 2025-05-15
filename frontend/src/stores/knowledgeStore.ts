import { create } from 'zustand';
import { KnowledgeService, KnowledgeItemDto, KnowledgeBaseResponseDto } from '../api';
import { toast } from 'react-toastify';

interface KnowledgeState {
  knowledgeItems: KnowledgeItemDto[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchKnowledgeItems: (botId: string) => Promise<KnowledgeItemDto[]>;
  addKnowledgeItem: (botId: string, item: {
    title: string;
    content: string;
    type: string;
    priority?: number;
  }) => Promise<KnowledgeItemDto>;
  updateKnowledgeItem: (botId: string, itemId: string, item: {
    title?: string;
    content?: string;
    type?: string;
    priority?: number;
  }) => Promise<KnowledgeItemDto>;
  deleteKnowledgeItem: (botId: string, itemId: string) => Promise<void>;
  resetState: () => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  knowledgeItems: [],
  isLoading: false,
  error: null,
  
  fetchKnowledgeItems: async (botId: string): Promise<KnowledgeItemDto[]> => {
    try {
      set({ isLoading: true, error: null });
      const response = await KnowledgeService.getKnowledgeItems(botId);
      set({ 
        knowledgeItems: response.items || [],
        isLoading: false 
      });
      return response.items || [];
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch knowledge items',
        isLoading: false 
      });
      throw error;
    }
  },
  
  addKnowledgeItem: async (botId: string, item): Promise<KnowledgeItemDto> => {
    try {
      set({ isLoading: true, error: null });
      const response = await KnowledgeService.addKnowledgeItem(botId, item);
      
      const currentItems = get().knowledgeItems;
      set({ 
        knowledgeItems: [...currentItems, response],
        isLoading: false 
      });
      
      toast.success('Knowledge item added successfully');
      return response;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to add knowledge item',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateKnowledgeItem: async (botId: string, itemId: string, item): Promise<KnowledgeItemDto> => {
    try {
      set({ isLoading: true, error: null });
      const response = await KnowledgeService.updateKnowledgeItem(botId, itemId, item);
      
      const currentItems = get().knowledgeItems;
      set({ 
        knowledgeItems: currentItems.map(i => i.id === itemId ? response : i),
        isLoading: false 
      });
      
      toast.success('Knowledge item updated successfully');
      return response;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update knowledge item',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteKnowledgeItem: async (botId: string, itemId: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      await KnowledgeService.deleteKnowledgeItem(botId, itemId);
      
      const currentItems = get().knowledgeItems;
      set({ 
        knowledgeItems: currentItems.filter(i => i.id !== itemId),
        isLoading: false 
      });
      
      toast.success('Knowledge item deleted successfully');
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to delete knowledge item',
        isLoading: false 
      });
      throw error;
    }
  },
  
  resetState: () => {
    set({
      knowledgeItems: [],
      isLoading: false,
      error: null
    });
  }
}));