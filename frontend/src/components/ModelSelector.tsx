import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  LLMProvider,
  ProviderModelsResponseDto,
  LLMModelData,
} from "../api/";
import { useLLMModelsStore } from "../stores/llmModelsStore";

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  defaultModel?: string;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelect,
  defaultModel = "gpt-3.5-turbo", // Default without provider prefix
  disabled = false,
}) => {
  const theme = useTheme();
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  
  // Use the centralized store instead of local state and direct API calls
  const { 
    providers, 
    isLoading, 
    error, 
    fetchProviders, 
    getProviderByModelId 
  } = useLLMModelsStore();

  // Fetch models once on component mount
  useEffect(() => {
    // This will use cached data if available and not stale
    fetchProviders().catch(error => {
      console.error("Error fetching models in ModelSelector:", error);
    });
  }, [fetchProviders]); // fetchProviders is stable across renders

  // Setup initial selection based on defaultModel and available providers
  useEffect(() => {
    // Skip if no providers or still loading
    if (providers.length === 0 || !defaultModel || isLoading) return;

    // Find provider that has the default model
    const providerWithModel = getProviderByModelId(defaultModel);
    
    if (providerWithModel) {
      // Found the model in a provider
      setSelectedProvider(providerWithModel.provider);
      setSelectedModel(defaultModel);
    } else if (providers.length > 0) {
      // Default model not found, select first provider and its first model
      const firstProvider = providers[0];
      if (!firstProvider) {
        return; // Guard against undefined provider
      }
      
      setSelectedProvider(firstProvider.provider);
      
      if (firstProvider.models && firstProvider.models.length > 0) {
        const firstModel = firstProvider.models[0];
        if (firstModel && firstModel.provider_model_id) {
          setSelectedModel(firstModel.provider_model_id);
          // Only notify parent if this is different from the defaultModel
          if (firstModel.provider_model_id !== defaultModel) {
            onModelSelect(firstModel.provider_model_id);
          }
        }
      }
    }
  }, [providers, defaultModel, isLoading, getProviderByModelId, onModelSelect]);

  // Memoize the current provider's models to prevent unnecessary re-renders
  const currentProviderModels = useMemo(() => {
    if (!selectedProvider) return [];
    
    const providerData = providers.find(
      p => p.provider.toLowerCase() === selectedProvider.toLowerCase()
    );
    
    return providerData?.models || [];
  }, [providers, selectedProvider]);

  // Handle provider selection change
  const handleProviderChange = useCallback((event: SelectChangeEvent<string>) => {
    const newProvider = event.target.value;
    setSelectedProvider(newProvider);

    // Find the provider data
    const providerData = providers.find(
      p => p.provider.toLowerCase() === newProvider.toLowerCase()
    );

    // Select first model from the new provider
    if (providerData?.models && providerData.models.length > 0) {
      const firstModel = providerData.models[0];
      if (firstModel && firstModel.provider_model_id) {
        setSelectedModel(firstModel.provider_model_id);
        onModelSelect(firstModel.provider_model_id);
      }
    }
  }, [providers, onModelSelect]);

  // Handle model selection change
  const handleModelChange = useCallback((event: SelectChangeEvent<string>) => {
    const newModelId = event.target.value;
    setSelectedModel(newModelId);
    onModelSelect(newModelId);
  }, [onModelSelect]);

  if (isLoading && providers.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="body2">Loading models...</Typography>
      </Box>
    );
  }

  if (error && providers.length === 0) {
    return (
      <Box sx={{ p: 2, color: theme.palette.error.main }}>
        <Typography variant="body2">
          Failed to load models. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
      }}
    >
      <FormControl fullWidth disabled={disabled || (isLoading && providers.length === 0)}>
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

      <FormControl fullWidth disabled={disabled || (isLoading && providers.length === 0)}>
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
          {currentProviderModels.map((model: LLMModelData) => (
            <MenuItem
              key={model.provider_model_id}
              value={model.provider_model_id}
            >
              {model.display_name || model.provider_model_id}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ModelSelector;
