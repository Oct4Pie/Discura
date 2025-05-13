import React, { useState, useEffect } from "react";
import {
  LlmService,
  LLMProvider
} from "../api/"

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  defaultProvider?: string;
  defaultModel?: string;
}

// Helper function to get model ID 
const getModelId = (provider: string, modelId: string): string => {
  return `${provider}/${modelId}`;
};

// Helper function to get available models for selection 
const getAvailableModelsForSelection = async () => {
  try {
    const response = await LlmService.getAllProviderModels();
    
    // Transform the response into the format expected by the component
    return response.providers.map((providerData) => ({
      provider: providerData.provider,
      providerDisplay: providerData.provider_display_name || providerData.provider,
      models: (providerData.models || []).map(model => ({
        id: model.id,
        displayName: model.display_name
      }))
    }));
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelect,
  defaultProvider = "openai",
  defaultModel = "",
}) => {
  const [providers, setProviders] = useState<
    {
      provider: string;
      providerDisplay: string;
      models: { id: string; displayName: string }[];
    }[]
  >([]);
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        setIsLoading(true);
        setError(null);

        const availableProviders = await getAvailableModelsForSelection();
        setProviders(availableProviders);

        // If no default model is specified, choose the first one from the selected provider
        if (!defaultModel && availableProviders.length > 0) {
          const provider =
            availableProviders.find((p) => p.provider === selectedProvider) ||
            availableProviders[0];
          if (provider && provider.models.length > 0) {
            setSelectedProvider(provider.provider);
            const firstModel = provider.models[0];
            if (firstModel) {
              setSelectedModel(firstModel.id);
              onModelSelect(firstModel.id); // Just pass the model ID
            }
          }
        }
      } catch (err) {
        setError("Failed to load models. Please try again later.");
        console.error("Error loading models:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, [defaultProvider, defaultModel, onModelSelect]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setSelectedProvider(newProvider);

    // When provider changes, select the first model from that provider
    const provider = providers.find((p) => p.provider === newProvider);
    if (provider && provider.models && provider.models.length > 0) {
      const firstModel = provider.models[0];
      if (firstModel) {
        setSelectedModel(firstModel.id);
        onModelSelect(firstModel.id);
      }
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    onModelSelect(newModel);
  };

  if (isLoading) {
    return <div>Loading models...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="model-selector">
      <div className="provider-select">
        <label htmlFor="provider-select">Provider:</label>
        <select
          id="provider-select"
          value={selectedProvider}
          onChange={handleProviderChange}
        >
          {providers.map((provider) => (
            <option key={provider.provider} value={provider.provider}>
              {provider.providerDisplay}
            </option>
          ))}
        </select>
      </div>

      <div className="model-select">
        <label htmlFor="model-select">Model:</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={handleModelChange}
        >
          {providers
            .find((p) => p.provider === selectedProvider)
            ?.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default ModelSelector;
