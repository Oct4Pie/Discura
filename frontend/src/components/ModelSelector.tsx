import React, { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  useTheme,
  alpha,
  SelectChangeEvent,
} from "@mui/material";
import {
  LlmService,
  LLMProvider,
  ProviderModelsResponseDto,
  LLMModelData
} from "../api/"

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  defaultModel?: string;
  disabled?: boolean;
}

// Helper function to get available models for selection 
const getAvailableModelsForSelection = async () => {
  try {
    // Use the API client to call the backend - this returns the properly typed response
    const response = await LlmService.getAllProviderModels();
    
    // Return the providers directly from the API without manual transformation
    // The API already provides all the data we need in the correct format
    return response.providers;
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelect,
  defaultModel = "openai/gpt-3.5-turbo",
  disabled = false
}) => {
  const theme = useTheme();
  const [providers, setProviders] = useState<ProviderModelsResponseDto[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available providers and models
  useEffect(() => {
    async function fetchModels() {
      try {
        setIsLoading(true);
        setError(null);

        const availableProviders = await getAvailableModelsForSelection();
        setProviders(availableProviders);
        
        // Find where the default model is
        if (defaultModel) {
          let providerFound = false;
          
          // Look through all providers to find the one containing our model
          for (const provider of availableProviders) {
            const modelInProvider = provider.models.find(model => model.provider_model_id === defaultModel);
            if (modelInProvider) {
              setSelectedProvider(provider.provider);
              setSelectedModel(defaultModel);
              providerFound = true;
              break;
            }
          }
          
          // If we couldn't find the provider with the default model, select the first available one
          if (!providerFound && availableProviders.length > 0) {
            const firstProvider = availableProviders[0];
            if (firstProvider) {
              setSelectedProvider(firstProvider.provider);
              
              if (firstProvider.models.length > 0) {
                const firstModel = firstProvider.models[0];
                if (firstModel && firstModel.provider_model_id) {
                  const firstModelId = firstModel.provider_model_id;
                  setSelectedModel(firstModelId);
                  onModelSelect(firstModelId); // Notify parent of the model change
                }
              }
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
  }, [defaultModel, onModelSelect]);

  const handleProviderChange = (event: SelectChangeEvent<string>) => {
    const newProvider = event.target.value;
    setSelectedProvider(newProvider);

    // Find the provider data using case-insensitive comparison
    const providerData = providers.find(p => 
      p.provider.toLowerCase() === newProvider.toLowerCase()
    );
    
    // When provider changes, select the first model from that provider
    if (providerData && providerData.models.length > 0) {
      // Safely access the first model
      const firstModelObj = providerData.models[0];
      if (firstModelObj) {
        const firstModelId = firstModelObj.provider_model_id;
        setSelectedModel(firstModelId);
        
        // Notify parent of the model change
        onModelSelect(firstModelId);
      }
    }
  };

  const handleModelChange = (event: SelectChangeEvent<string>) => {
    const newModelId = event.target.value;
    setSelectedModel(newModelId);
    
    // Notify parent of the model change
    onModelSelect(newModelId);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2">Loading models...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: theme.palette.error.main }}>
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
      <FormControl fullWidth disabled={disabled || isLoading}>
        <InputLabel id="provider-select-label">Provider</InputLabel>
        <Select
          labelId="provider-select-label"
          id="provider-select"
          value={selectedProvider}
          onChange={handleProviderChange}
          label="Provider"
          sx={{
            backgroundColor: alpha(theme.palette.common.white, 0.9),
            borderRadius: 1.5,
            "& .MuiOutlinedInput-notchedOutline": {
              borderRadius: 1.5,
            },
          }}
        >
          {providers.map((provider) => (
            <MenuItem key={provider.provider} value={provider.provider}>
              {provider.provider_display_name || provider.provider}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={disabled || isLoading}>
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          id="model-select"
          value={selectedModel}
          onChange={handleModelChange}
          label="Model"
          sx={{
            backgroundColor: alpha(theme.palette.common.white, 0.9),
            borderRadius: 1.5,
            "& .MuiOutlinedInput-notchedOutline": {
              borderRadius: 1.5,
            },
          }}
        >
          {providers
            .find((p) => p.provider.toLowerCase() === selectedProvider.toLowerCase())
            ?.models.map((model: LLMModelData) => (
              <MenuItem key={model.provider_model_id} value={model.provider_model_id}>
                {model.display_name || model.provider_model_id}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ModelSelector;
