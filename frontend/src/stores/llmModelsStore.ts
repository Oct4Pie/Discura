import { create } from "zustand";
import { LlmService, ProviderModelsResponseDto, LLMModelData } from "../api";

interface LLMModelsState {
  providers: ProviderModelsResponseDto[];
  isLoading: boolean;
  error: any;
  lastFetched: number | null;

  // Actions
  fetchProviders: () => Promise<ProviderModelsResponseDto[]>;
  getModelById: (modelId: string) => LLMModelData | undefined;
  getProviderByModelId: (
    modelId: string
  ) => ProviderModelsResponseDto | undefined;
  clearCache: () => void;
  isStale: () => boolean;
}

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export const useLLMModelsStore = create<LLMModelsState>((set, get) => ({
  providers: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  isStale: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;

    const now = Date.now();
    return now - lastFetched > CACHE_EXPIRATION;
  },

  fetchProviders: async () => {
    const { providers, isLoading, isStale } = get();

    // Return cached data if available and not stale
    if (providers.length > 0 && !isStale() && !isLoading) {
      return providers;
    }

    // Prevent concurrent fetches
    if (isLoading) {
      // Wait for the ongoing request to complete
      return new Promise((resolve) => {
        const checkStoreInterval = setInterval(() => {
          const state = get();
          if (!state.isLoading) {
            clearInterval(checkStoreInterval);
            resolve(state.providers);
          }
        }, 100);
      });
    }

    set({ isLoading: true, error: null });

    try {
      console.log("[LLMModelsStore] Fetching providers and models");
      const response = await LlmService.getAllProviderModels();

      if (response && response.providers) {
        set({
          providers: response.providers,
          isLoading: false,
          lastFetched: Date.now(),
        });
        return response.providers;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching LLM providers and models:", error);
      set({ error, isLoading: false });
      throw error;
    }
  },

  getModelById: (modelId: string) => {
    const { providers } = get();

    for (const provider of providers) {
      const model = provider.models.find(
        (m) => m.provider_model_id === modelId || m.id === modelId
      );
      if (model) return model;
    }

    return undefined;
  },

  getProviderByModelId: (modelId: string) => {
    const { providers } = get();

    return providers.find((provider) =>
      provider.models.some(
        (model) => model.provider_model_id === modelId || model.id === modelId
      )
    );
  },

  clearCache: () => {
    set({
      providers: [],
      lastFetched: null,
    });
  },
}));
