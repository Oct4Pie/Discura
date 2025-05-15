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
  Alert,
} from "@mui/material";
import { LLMProvider, LLMModelData } from "../api/";
import { useLLMModelsStore } from "../stores/llmModelsStore";

interface VisionModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  onProviderSelect?: (providerId: string) => void; // Add new callback for provider selection
  defaultModel?: string;
  disabled?: boolean;
}

const VisionModelSelector: React.FC<VisionModelSelectorProps> = ({
  onModelSelect,
  onProviderSelect,
  defaultModel = "",
  disabled = false,
}) => {
  const theme = useTheme();
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Use the centralized store instead of local state and direct API calls
  const { providers, isLoading, error, fetchProviders, getProviderByModelId } =
    useLLMModelsStore();

  // Filter providers to only those with vision-capable models
  const visionProviders = useMemo(() => {
    return providers.filter((provider) =>
      provider.models.some(
        (model) =>
          model.capabilities && model.capabilities.supports_vision === true
      )
    );
  }, [providers]);

  // Fetch models once on component mount
  useEffect(() => {
    // This will use cached data if available and not stale
    fetchProviders().catch((error) => {
      console.error("Error fetching vision models:", error);
    });
  }, [fetchProviders]); // fetchProviders is stable across renders

  // Setup initial selection based on defaultModel and available providers
  useEffect(() => {
    // Allow empty selection (no vision model)
    if (defaultModel === "") {
      setSelectedModel("");
      setSelectedProvider("");
      return;
    }

    // Skip if no providers or still loading
    if (visionProviders.length === 0 || isLoading) return;

    // Find provider that has the default model
    const providerWithModel = getProviderByModelId(defaultModel);

    if (providerWithModel) {
      // Verify if the model actually supports vision
      const modelDetails = providerWithModel.models.find(
        (m) => m.provider_model_id === defaultModel
      );

      if (modelDetails?.capabilities?.supports_vision) {
        // Found a vision-capable model
        setSelectedProvider(providerWithModel.provider);
        setSelectedModel(defaultModel);
      } else {
        // Default model doesn't support vision, select first vision provider and model
        selectFirstVisionModel();
      }
    } else if (visionProviders.length > 0) {
      // Default model not found, select first provider with vision support
      selectFirstVisionModel();
    }
  }, [
    visionProviders,
    defaultModel,
    isLoading,
    getProviderByModelId,
    onModelSelect,
  ]);

  // Helper to select the first available vision model
  const selectFirstVisionModel = useCallback(() => {
    if (visionProviders.length > 0) {
      const firstVisionProvider = visionProviders[0];
      if (firstVisionProvider) {
        setSelectedProvider(firstVisionProvider.provider);

        // Find first vision-capable model in this provider
        const firstVisionModel = firstVisionProvider.models.find(
          (model) =>
            model.capabilities && model.capabilities.supports_vision === true
        );

        if (firstVisionModel) {
          setSelectedModel(firstVisionModel.provider_model_id);
          onModelSelect(firstVisionModel.provider_model_id);
        }
      }
    }
  }, [visionProviders, onModelSelect]);

  // Memoize the current provider's vision models
  const currentProviderVisionModels = useMemo(() => {
    if (!selectedProvider) return [];

    const providerData = visionProviders.find(
      (p) => p.provider.toLowerCase() === selectedProvider.toLowerCase()
    );

    // Filter to only include models with vision support
    return (
      providerData?.models.filter(
        (model) =>
          model.capabilities && model.capabilities.supports_vision === true
      ) || []
    );
  }, [visionProviders, selectedProvider]);

  // Handle provider selection change
  const handleProviderChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newProvider = event.target.value;
      setSelectedProvider(newProvider);

      // Find the provider data
      const providerData = visionProviders.find(
        (p) => p.provider.toLowerCase() === newProvider.toLowerCase()
      );

      // Select first vision model from the new provider
      if (providerData?.models) {
        const firstVisionModel = providerData.models.find(
          (model) =>
            model.capabilities && model.capabilities.supports_vision === true
        );

        if (firstVisionModel) {
          setSelectedModel(firstVisionModel.provider_model_id);
          onModelSelect(firstVisionModel.provider_model_id);
        }
      }

      // Call the onProviderSelect callback if provided
      if (onProviderSelect) {
        onProviderSelect(newProvider);
      }
    },
    [visionProviders, onModelSelect, onProviderSelect]
  );

  // Handle model selection change
  const handleModelChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newModelId = event.target.value;
      setSelectedModel(newModelId);
      onModelSelect(newModelId);
      
      // Also pass the currently selected provider when model changes
      if (onProviderSelect && selectedProvider) {
        onProviderSelect(selectedProvider);
      }
    },
    [onModelSelect, onProviderSelect, selectedProvider]
  );

  // Handle the special case for "No vision model"
  const handleNoVisionModel = useCallback(() => {
    setSelectedModel("");
    setSelectedProvider("");
    onModelSelect("");
    // Also clear the provider when selecting "No vision model"
    if (onProviderSelect) {
      onProviderSelect("");
    }
  }, [onModelSelect, onProviderSelect]);

  if (isLoading && providers.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="body2">Loading vision models...</Typography>
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

  // If no vision models are available
  if (visionProviders.length === 0 && !isLoading) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No vision-capable models available. Make sure your API keys are
        configured properly.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <MenuItem
        value=""
        onClick={handleNoVisionModel}
        sx={{
          mb: 2,
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          backgroundColor:
            selectedModel === ""
              ? alpha(theme.palette.primary.main, 0.1)
              : "transparent",
        }}
      >
        <Typography fontWeight={selectedModel === "" ? 600 : 400}>
          No vision model (use primary LLM if it supports vision)
        </Typography>
      </MenuItem>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mt: 2,
        }}
      >
        <FormControl
          fullWidth
          disabled={disabled || (isLoading && visionProviders.length === 0)}
        >
          <InputLabel id="vision-provider-select-label">
            Vision Provider
          </InputLabel>
          <Select
            labelId="vision-provider-select-label"
            id="vision-provider-select"
            value={selectedProvider}
            onChange={handleProviderChange}
            label="Vision Provider"
            sx={{
              backgroundColor: alpha(theme.palette.common.white, 0.9),
              borderRadius: 1.5,
              "& .MuiOutlinedInput-notchedOutline": {
                borderRadius: 1.5,
              },
            }}
          >
            {visionProviders.map((provider) => (
              <MenuItem key={provider.provider} value={provider.provider}>
                {provider.provider_display_name || provider.provider}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          disabled={
            disabled ||
            !selectedProvider ||
            (isLoading && visionProviders.length === 0)
          }
        >
          <InputLabel id="vision-model-select-label">Vision Model</InputLabel>
          <Select
            labelId="vision-model-select-label"
            id="vision-model-select"
            value={selectedModel}
            onChange={handleModelChange}
            label="Vision Model"
            sx={{
              backgroundColor: alpha(theme.palette.common.white, 0.9),
              borderRadius: 1.5,
              "& .MuiOutlinedInput-notchedOutline": {
                borderRadius: 1.5,
              },
            }}
          >
            {currentProviderVisionModels.map((model: LLMModelData) => (
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
    </Box>
  );
};

export default VisionModelSelector;
