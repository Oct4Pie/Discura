import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  PowerSettingsNew as PowerIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Book as BookIcon,
  Build as BuildIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Launch as LaunchIcon,
  AddCircle as AddCircleIcon,
  Bolt as BoltIcon,
  Brush as BrushIcon,
  SmartToy as BotIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BotStatus } from "../types";
import {
  LLMProvider,
  BotsService,
  ImageProvider,
  UpdateBotConfigurationRequestDto,
  BotConfiguration,
  // RegisterCommandsResponseDto is not needed - we'll use MessageResponseDto
} from "../api/";
import { handleApiError } from "../api"; // Import error handler
import BotStatusBadge from "../components/BotStatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import GridItem from "../components/GridItem";
import TabPanel from "../components/TabPanel";
import ValidationErrorDisplay from "../components/ValidationErrorDisplay"; // Import validation error display
import { useBotStore } from "../stores/botStore";
import { useLLMModelsStore } from "../stores/llmModelsStore"; // Import the LLM models store
import PersonalityPreview from "../components/PersonalityPreview";
import ModelSelector from "../components/ModelSelector";
import KnowledgeTab from "../components/KnowledgeTab"; // Import the KnowledgeTab component
import VisionModelSelector from "../components/VisionModelSelector"; // Import the new VisionModelSelector

const BotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [botActionInProgress, setBotActionInProgress] = useState(false);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [guildId, setGuildId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Add state for validation errors
  const [validationError, setValidationError] = useState<any>(null);

  const {
    currentBot,
    fetchBot,
    updateBot,
    deleteBot,
    startBot,
    stopBot,
    isLoading,
    updateBotConfiguration,
  } = useBotStore();

  // Use the LLM models store to access cached provider and model data
  const { providers, fetchProviders, getProviderByModelId } =
    useLLMModelsStore();

  // Form state
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [personality, setPersonality] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState("");
  const [backstory, setBackstory] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<string>("openai/gpt-4o-mini");
  const [imageGenEnabled, setImageGenEnabled] = useState(false);
  const [imageProvider, setImageProvider] = useState<ImageProvider>(
    ImageProvider.OPENAI
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Appearance settings state
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [presenceStatus, setPresenceStatus] = useState<
    "online" | "idle" | "dnd" | "invisible"
  >("online");
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState<number>(0); // 0 = PLAYING
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");

  // Vision model state
  const [visionModel, setVisionModel] = useState<string>("");
  const [visionProvider, setVisionProvider] = useState<string>("");

  // Model capabilities state
  const [modelSupportsTools, setModelSupportsTools] = useState<boolean>(false);

  // Tools state
  const [toolsEnabled, setToolsEnabled] = useState<boolean>(false);

  // Clear validation error when changing tabs
  useEffect(() => {
    setValidationError(null);
  }, [tabValue]);

  // Load bot data
  useEffect(() => {
    if (id) {
      fetchBot(id);
    }
  }, [id, fetchBot]);

  // Update form when bot data changes
  useEffect(() => {
    if (currentBot) {
      setName(currentBot.name);
      setSystemPrompt(currentBot.configuration?.systemPrompt || "");
      setPersonality(currentBot.configuration?.personality || "");
      setTraits(currentBot.configuration?.traits || []);
      setBackstory(currentBot.configuration?.backstory || "");

      // Set the model ID directly instead of attempting to concatenate provider and model
      if (currentBot.configuration?.llmModel) {
        // The llmModel should already be in the format "provider/model-name"
        setSelectedModel(currentBot.configuration.llmModel);
      } else {
        setSelectedModel("openai/gpt-4o-mini"); // default
      }

      setImageGenEnabled(
        currentBot.configuration?.imageGeneration?.enabled || false
      );

      if (currentBot.configuration?.imageGeneration?.provider) {
        setImageProvider(currentBot.configuration.imageGeneration.provider);
      } else {
        setImageProvider(ImageProvider.OPENAI);
      }

      // Load appearance settings
      if (currentBot.configuration?.appearance) {
        // Avatar URL
        setAvatarUrl(currentBot.configuration.appearance.avatarUrl || "");
        setAvatarPreview(currentBot.configuration.appearance.avatarUrl || null);

        // Presence status
        setPresenceStatus(
          currentBot.configuration.appearance.presence?.status || "online"
        );

        // Activity
        if (currentBot.configuration.appearance.presence?.activity) {
          setActivityName(
            currentBot.configuration.appearance.presence.activity.name || ""
          );
          setActivityType(
            currentBot.configuration.appearance.presence.activity.type || 0
          );
        }

        // Colors
        setPrimaryColor(
          currentBot.configuration.appearance.colors?.primary || ""
        );
        setAccentColor(
          currentBot.configuration.appearance.colors?.accent || ""
        );
      }

      // Load vision model
      setVisionModel(currentBot.configuration?.visionModel || "");
      
      // Load tools configuration
      setToolsEnabled(currentBot.configuration?.toolsEnabled || false);
    }
  }, [currentBot]);

  // Update the model capabilities when the selected model changes
  useEffect(() => {
    const checkModelCapabilities = async () => {
      try {
        // Ensure we have the latest providers data
        await fetchProviders();

        // Find the selected model in our providers data
        const providers = useLLMModelsStore.getState().providers;

        // Look for the model in all providers
        let foundModel = null;
        for (const provider of providers) {
          const model = provider.models.find((m) => m.id === selectedModel);
          if (model) {
            foundModel = model;
            break;
          }
        }

        // Check if the model supports tool calling
        if (foundModel && foundModel.capabilities) {
          setModelSupportsTools(
            !!foundModel.capabilities.supports_tool_calling
          );
        } else {
          // Default to false if we can't find the model or its capabilities
          setModelSupportsTools(false);
        }
      } catch (error) {
        console.error("Error checking model capabilities:", error);
        setModelSupportsTools(false);
      }
    };

    checkModelCapabilities();
  }, [selectedModel, fetchProviders]);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddTrait = () => {
    if (newTrait && !traits.includes(newTrait)) {
      setTraits([...traits, newTrait]);
      setNewTrait("");
    }
  };

  const handleRemoveTrait = (traitToRemove: string) => {
    setTraits(traits.filter((trait) => trait !== traitToRemove));
  };

  const handleSaveBasicInfo = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    setValidationError(null); // Clear previous errors

    try {
      await updateBot(id, { name });
      toast.success("Bot information updated");
    } catch (error) {
      // Use the structured error handling
      setValidationError(error);
      // Don't show toast since we're displaying the error in the UI
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonality = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    setValidationError(null); // Clear previous errors

    try {
      // Create a new configuration object that retains all existing config values
      // but updates the personality-related fields
      const updatedConfig: BotConfiguration = {
        ...currentBot.configuration,
        systemPrompt,
        personality,
        traits,
        backstory,
      };

      // Use the typed DTO for the update
      const configUpdate: UpdateBotConfigurationRequestDto = {
        configuration: updatedConfig,
      };

      await updateBotConfiguration(id, configUpdate.configuration);
      toast.success("Bot personality updated");
    } catch (error) {
      // Use the structured error handling
      setValidationError(error);
      // Don't show toast since we're displaying the error in the UI
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLLMSettings = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    setValidationError(null); // Clear previous errors

    try {
      // Ensure we have the latest providers data from the store
      // This will use the cached data if available and not stale
      await fetchProviders();

      // Find the model in the store
      const providerWithModel = getProviderByModelId(selectedModel);
      let matchedProvider: LLMProvider | undefined;

      if (providerWithModel) {
        // Convert string provider to proper enum value
        // First, get the uppercase provider name for enum mapping
        const providerKey =
          providerWithModel.provider.toUpperCase() as keyof typeof LLMProvider;
        // Then map to the actual enum value
        matchedProvider = LLMProvider[providerKey];

        // Fallback to current provider if mapping fails
        if (!matchedProvider) {
          console.warn(
            `Failed to map provider ${providerWithModel.provider} to LLMProvider enum value. Using current provider as fallback.`
          );
          matchedProvider = currentBot.configuration?.llmProvider;
        }
      } else {
        console.warn(
          `Could not find model ${selectedModel} in the cached providers data. Using current provider as fallback.`
        );
        matchedProvider = currentBot.configuration?.llmProvider;
      }

      // Create a new configuration object that retains all existing config values
      const updatedConfig: BotConfiguration = {
        ...currentBot.configuration,
        // Use the proper enum value for the provider
        llmProvider: matchedProvider,
        // Use the selected model ID directly from the ModelSelector
        llmModel: selectedModel,
        // Use an empty string as default for visionModel if it's undefined
        visionModel: visionModel || "",
        // Include the visionProvider value
        visionProvider: visionProvider || "",
      };

      // Use the typed DTO for the update
      const configUpdate: UpdateBotConfigurationRequestDto = {
        configuration: updatedConfig,
      };

      await updateBotConfiguration(id, configUpdate.configuration);
      toast.success("LLM settings updated");
    } catch (error) {
      // Use the structured error handling
      setValidationError(error);
      // Don't show toast since we're displaying the error in the UI
    } finally {
      setSaving(false);
    }
  };

  const handleSaveImageSettings = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    setValidationError(null); // Clear previous errors

    try {
      // Create a new configuration object with only the required fields
      // Explicitly defining a clean image generation config without any model field
      const updatedConfig: BotConfiguration = {
        // Preserve all other configuration values
        systemPrompt: currentBot.configuration?.systemPrompt || "",
        personality: currentBot.configuration?.personality || "",
        traits: currentBot.configuration?.traits || [],
        backstory: currentBot.configuration?.backstory || "",
        llmProvider: currentBot.configuration?.llmProvider,
        llmModel: currentBot.configuration?.llmModel || "",
        knowledge: currentBot.configuration?.knowledge || [],
        toolsEnabled: currentBot.configuration?.toolsEnabled || false,
        tools: currentBot.configuration?.tools || [],
        // Add the visionModel property - maintain current value or use empty string as default
        visionModel: currentBot.configuration?.visionModel || "",
        // Add the visionProvider property - maintain current value or use default
        visionProvider: currentBot.configuration?.visionProvider || "",
        // Create a fresh imageGeneration object with only the fields we need
        imageGeneration: {
          enabled: imageGenEnabled,
          provider: imageProvider,
          model: undefined,
        },
      };

      // Use the typed DTO for the update
      const configUpdate: UpdateBotConfigurationRequestDto = {
        configuration: updatedConfig,
      };

      configUpdate.configuration.imageGeneration.model = "m";

      await updateBotConfiguration(id, configUpdate.configuration);
      toast.success("Image generation settings updated");
    } catch (error) {
      // Use the structured error handling
      setValidationError(error);
      // Don't show toast since we're displaying the error in the UI
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearanceSettings = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    setValidationError(null); // Clear previous errors

    try {
      // Create a new configuration object that retains all existing config values
      // but updates the appearance-related fields
      const updatedConfig: BotConfiguration = {
        ...currentBot.configuration,
        appearance: {
          avatarUrl,
          presence: {
            status: presenceStatus as any,
            activity: activityName
              ? {
                  name: activityName,
                  type: activityType,
                }
              : undefined,
          },
          colors: {
            primary: primaryColor,
            accent: accentColor,
          },
        },
      };

      // Use the typed DTO for the update
      const configUpdate: UpdateBotConfigurationRequestDto = {
        configuration: updatedConfig,
      };

      await updateBotConfiguration(id, configUpdate.configuration);
      toast.success("Bot appearance updated");

      // If the bot is currently online, let the user know that the changes
      // will be applied immediately but avatar changes may be rate-limited
      if (currentBot.status === BotStatus.ONLINE && avatarUrl) {
        toast.info(
          "Bot is online. Changes will be applied immediately, but Discord limits avatar updates to 2 per hour.",
          { autoClose: 6000 }
        );
      }
    } catch (error) {
      // Use the structured error handling
      setValidationError(error);
      // Don't show toast since we're displaying the error in the UI
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToolSettings = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    setValidationError(null); // Clear previous errors

    try {
      // Create a new configuration object that retains all existing config values
      // but updates the tools-related fields
      const updatedConfig: BotConfiguration = {
        ...currentBot.configuration,
        toolsEnabled,
      };

      // Use the typed DTO for the update
      const configUpdate: UpdateBotConfigurationRequestDto = {
        configuration: updatedConfig,
      };

      await updateBotConfiguration(id, configUpdate.configuration);
      toast.success("Bot tools settings updated");
    } catch (error) {
      // Use the structured error handling
      setValidationError(error);
      // Don't show toast since we're displaying the error in the UI
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBot = async () => {
    if (!id) return;

    try {
      await deleteBot(id);
      toast.success("Bot deleted successfully");
      navigate("/bots");
    } catch (error) {
      // Set validation error for display in the UI
      setValidationError(error);

      // Also show toast for immediate feedback
      toast.error("Failed to delete bot");
      console.error("Delete bot error:", error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!id) return;

    // Clear any previous errors and show loading state if needed
    setValidationError(null);

    try {
      // Call the API to generate the invite link using the correct method name
      const response = await BotsService.generateInviteLink(id);
      if (response && response.inviteUrl) {
        setInviteUrl(response.inviteUrl);
        setInviteDialogOpen(true);
      }
    } catch (error) {
      // Set validation error for display in the UI
      setValidationError(error);

      // Also show toast for immediate feedback
      toast.error("Failed to generate invite link");
      console.error("Generate invite link error:", error);
    }
  };

  const handleToggleBotStatus = async () => {
    if (!currentBot || !id) return;

    setBotActionInProgress(true);
    setSnackbarMessage(
      `${currentBot.status === BotStatus.ONLINE ? "Stopping" : "Starting"} bot...`
    );
    setSnackbarOpen(true);
    // Clear any existing validation error
    setValidationError(null);

    try {
      if (currentBot.status === BotStatus.ONLINE) {
        await stopBot(id);
        toast.success("Bot stopped successfully");
        setSnackbarMessage("Bot stopped successfully! It is now offline.");
      } else {
        await startBot(id);
        toast.success("Bot started successfully");
        setSnackbarMessage(
          "Bot started successfully! It is now online and ready to chat."
        );
      }

      // Explicitly refresh the bot status to ensure the UI shows the most current state
      await fetchBot(id);
    } catch (error: any) {
      // Set validation error for display in the UI
      setValidationError(error);

      // Extract the error message from the structured error object
      // The OpenAPI error middleware returns error objects with a message property
      const errorMessage =
        error?.message ||
        `Failed to ${currentBot.status === BotStatus.ONLINE ? "stop" : "start"} bot`;

      // Update the snackbar with the error message
      setSnackbarMessage(`Error: ${errorMessage}`);
      console.error("Toggle bot status error:", error);
    } finally {
      setBotActionInProgress(false);

      // Leave snackbar open to show final status
      setTimeout(() => {
        setSnackbarOpen(false);
      }, 5000); // Keep success/error message visible for 5 seconds
    }
  };

  const handleRegisterCommands = async () => {
    if (!id) return;

    setRegistrationInProgress(true);
    setValidationError(null); // Clear previous errors

    try {
      let response;

      // The API requires a guildId parameter, so use empty string for global registration
      // Check if we have a specific guild ID to register commands for
      const trimmedGuildId = guildId.trim();

      // Register commands - always provide a guildId parameter (empty string for global)
      response = await BotsService.registerBotCommands(id, {
        guildId: trimmedGuildId || "",
      });

      toast.success(response.message || "Commands registered successfully");
      setRegisterDialogOpen(false);
      setGuildId("");
    } catch (error) {
      setValidationError(error);
      toast.error("Failed to register commands");
      console.error("Register commands error:", error);
    } finally {
      setRegistrationInProgress(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite URL copied to clipboard");
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentBot) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: 1, // Custom border radius for alert
          border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
        }}
      >
        Bot not found. It may have been deleted or you don't have access to it.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          gap: 2,
          flexWrap: { xs: "wrap", sm: "nowrap" },
          width: "100%",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}
        >
          <IconButton
            onClick={() => navigate("/bots")}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: "8px", // Custom border radius for icon button
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="h4" component="h1" fontWeight={600}>
                {currentBot.name}
              </Typography>
              <BotStatusBadge status={currentBot.status as BotStatus} />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {currentBot.configuration?.personality ||
                "No personality defined"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: { xs: 2, sm: 0 },
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<BoltIcon />}
            onClick={() => setRegisterDialogOpen(true)}
            sx={{
              borderWidth: 1.5,
              borderRadius: 1,
              "&:hover": {
                borderWidth: 1.5,
              },
            }}
          >
            Register Commands
          </Button>

          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={handleGenerateInviteLink}
            sx={{
              borderWidth: 1.5,
              borderRadius: 1, // Custom border radius for button
              "&:hover": {
                borderWidth: 1.5,
              },
            }}
          >
            Invite Bot
          </Button>

          {/* Toggle button with localized spinner */}
          <Button
            variant="contained"
            color={
              String(currentBot.status).toUpperCase() === "ONLINE"
                ? "error"
                : "success"
            }
            startIcon={
              botActionInProgress ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PowerIcon />
              )
            }
            onClick={handleToggleBotStatus}
            disabled={
              botActionInProgress ||
              String(currentBot.status).toUpperCase() === "ERROR"
            }
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: 1,
              boxShadow: `0 4px 12px ${alpha(
                String(currentBot.status).toUpperCase() === "ONLINE"
                  ? theme.palette.error.main
                  : theme.palette.success.main,
                0.2
              )}`,
              transition: "all 0.3s",
              minWidth: "120px",
              fontWeight: 600,
              position: "relative",
              "&:hover": {
                boxShadow: `0 6px 15px ${alpha(
                  String(currentBot.status).toUpperCase() === "ONLINE"
                    ? theme.palette.error.main
                    : theme.palette.success.main,
                  0.3
                )}`,
              },
            }}
          >
            {String(currentBot.status).toUpperCase() === "ONLINE"
              ? "Stop Bot"
              : "Start Bot"}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              borderWidth: 1.5,
              borderRadius: 1, // Custom border radius for button
              "&:hover": {
                borderWidth: 1.5,
              },
            }}
          >
            Delete Bot
          </Button>
        </Box>
      </Box>

      {/* Status alert when bot is in error state */}
      {currentBot.status === BotStatus.ERROR && (
        <Alert
          severity="error"
          sx={{
            mb: 4,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
          }}
        >
          This bot encountered an error. The token may be invalid or the Message
          Content Intent may not be enabled. Please check your configuration and
          try starting the bot again.
        </Alert>
      )}

      {/* Validation error display */}
      {validationError && (
        <ValidationErrorDisplay
          error={validationError}
          onClose={() => setValidationError(null)}
        />
      )}

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2, // Custom border radius for paper
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          aria-label="bot configuration tabs"
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            "& .MuiTab-root": {
              py: 2,
              px: 3,
              minHeight: "unset",
            },
          }}
        >
          <Tab
            icon={<SettingsIcon sx={{ mb: 0.5 }} />}
            label="Basic Info"
            iconPosition="top"
          />
          <Tab
            icon={<PersonIcon sx={{ mb: 0.5 }} />}
            label="Personality"
            iconPosition="top"
          />
          <Tab
            icon={<CodeIcon sx={{ mb: 0.5 }} />}
            label="LLM Settings"
            iconPosition="top"
          />
          <Tab
            icon={<ImageIcon sx={{ mb: 0.5 }} />}
            label="Image Generation"
            iconPosition="top"
          />
          <Tab
            icon={<BrushIcon sx={{ mb: 0.5 }} />}
            label="Appearance"
            iconPosition="top"
          />
          <Tab
            icon={<BookIcon sx={{ mb: 0.5 }} />}
            label="Knowledge"
            iconPosition="top"
          />
          <Tab
            icon={<BuildIcon sx={{ mb: 0.5 }} />}
            label="Tools"
            iconPosition="top"
            disabled={!modelSupportsTools}
          />
        </Tabs>

        {/* Basic Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bot Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  placeholder="Enter a descriptive name for your bot"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5, // Custom border radius for text field
                    },
                  }}
                />
              </GridItem>

              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Application ID"
                  value={currentBot.applicationId}
                  InputProps={{
                    readOnly: true,
                    sx: {
                      backgroundColor: alpha(theme.palette.grey[100], 0.8),
                      fontFamily: "monospace",
                    },
                  }}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5, // Custom border radius for text field
                    },
                  }}
                />
              </GridItem>

              <GridItem item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Discord Bot Token
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      type="password"
                      value="••••••••••••••••••••••••••••••••••••••••••"
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1
                              ),
                              color: theme.palette.primary.main,
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              mr: 1,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            SECURED
                          </Box>
                        ),
                      }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: alpha(
                            theme.palette.common.white,
                            0.9
                          ),
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  </Box>

                  <Alert
                    severity="info"
                    sx={{
                      mb: 2,
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    }}
                  >
                    For security, Discord bot tokens are encrypted and cannot be
                    viewed after creation. If you need to update your token, you
                    can use the form below.
                  </Alert>

                  <Box
                    component="form"
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                      alignItems: { xs: "stretch", sm: "flex-start" },
                    }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      // Clear any previous errors
                      setValidationError(null);

                      if (id && document.getElementById("new-token")) {
                        const tokenInput = document.getElementById(
                          "new-token"
                        ) as HTMLInputElement;
                        if (tokenInput && tokenInput.value) {
                          updateBot(id, { discordToken: tokenInput.value })
                            .then(() => {
                              tokenInput.value = "";
                              toast.success("Bot token updated successfully");
                            })
                            .catch((error) => {
                              // Set validation error for display in the UI
                              setValidationError(error);
                              console.error("Error updating token:", error);
                              toast.error("Failed to update bot token");
                            });
                        }
                      }
                    }}
                  >
                    <TextField
                      id="new-token"
                      label="New Discord Token"
                      placeholder="Enter new bot token from Discord Developer Portal"
                      fullWidth
                      sx={{
                        flexGrow: 1,
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: alpha(
                            theme.palette.common.white,
                            0.9
                          ),
                          borderRadius: 1.5,
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="outlined"
                      color="primary"
                      sx={{
                        px: 3,
                        borderRadius: 1,
                        height: { xs: "auto", sm: 56 },
                        whiteSpace: "nowrap",
                      }}
                    >
                      Update Token
                    </Button>
                  </Box>
                </Paper>
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveBasicInfo}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 1, // Custom border radius for button
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Personality Tab - Improved UI for better handling of long text and multiple traits */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <GridItem item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" fontWeight={500}>
                    Bot Personality Settings
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => setPreviewOpen(true)}
                    sx={{ borderRadius: 1 }}
                  >
                    Preview Personality
                  </Button>
                </Box>

                {/* System Prompt with improved UI for longer text */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    mb: 4,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    System Prompt
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Instructions for the AI on how to behave and respond"
                    helperText="This is the primary instruction set that defines your bot's behavior"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: alpha(theme.palette.common.white, 0.9),
                        borderRadius: 1.5,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Use variables like {"{{"} botName {"}}}"} in your prompt to
                    dynamically insert the bot's name.
                  </Typography>
                </Paper>
              </GridItem>

              {/* Personality section */}
              <GridItem item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={500}
                    sx={{ mb: 2 }}
                  >
                    Personality
                  </Typography>
                  <TextField
                    fullWidth
                    label="Personality Description"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="e.g., Friendly, Sarcastic, Professional"
                    helperText="A short description of your bot's personality"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: alpha(theme.palette.common.white, 0.9),
                        borderRadius: 1.5,
                      },
                    }}
                  />
                </Box>
              </GridItem>

              {/* Traits with improved UI for adding multiple traits */}
              <GridItem item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={500}
                    sx={{ mb: 2 }}
                  >
                    Traits
                  </Typography>
                  <Box sx={{ display: "flex", mb: 2 }}>
                    <TextField
                      fullWidth
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      placeholder="Add personality traits"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTrait();
                        }
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: alpha(
                            theme.palette.common.white,
                            0.9
                          ),
                          borderRadius: "8px 0 0 8px",
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddTrait}
                      disabled={!newTrait}
                      startIcon={<AddCircleIcon />}
                      sx={{
                        borderRadius: "0 8px 8px 0",
                        px: 2,
                      }}
                    >
                      Add
                    </Button>
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
                      minHeight: "100px",
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.5
                      ),
                    }}
                  >
                    {traits.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        No traits added yet. Traits help define your bot's
                        personality characteristics.
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {traits.map((trait) => (
                          <Chip
                            key={trait}
                            label={trait}
                            onDelete={() => handleRemoveTrait(trait)}
                            color="primary"
                            variant="outlined"
                            sx={{
                              borderRadius: 1,
                              borderWidth: 1.5,
                              "& .MuiChip-deleteIcon": {
                                color: theme.palette.primary.main,
                              },
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Box>
              </GridItem>

              {/* Backstory with improved UI for longer text */}
              <GridItem item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Backstory
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    value={backstory}
                    onChange={(e) => setBackstory(e.target.value)}
                    placeholder="The background and history of your bot"
                    helperText="Give your bot a rich backstory to enhance its character"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: alpha(theme.palette.common.white, 0.9),
                        borderRadius: 1.5,
                      },
                    }}
                  />
                </Paper>
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePersonality}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 1, // Custom border radius for button
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* LLM Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <GridItem item xs={12}>
                <Typography variant="h6" fontWeight={500} gutterBottom>
                  Language Model Settings
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Primary LLM Model
                  </Typography>

                  <ModelSelector
                    onModelSelect={(modelId) => setSelectedModel(modelId)}
                    defaultModel={selectedModel}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Select the AI model that powers your bot's text responses.
                    This determines the capabilities and quality of your bot's
                    conversations.
                  </Typography>
                </Paper>
              </GridItem>

              <GridItem item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <VisibilityIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Vision Model
                    </Typography>
                  </Box>

                  {/* Vision Model Selector */}
                  <VisionModelSelector
                    onModelSelect={(modelId) => setVisionModel(modelId)}
                    onProviderSelect={(providerId) => setVisionProvider(providerId)}
                    defaultModel={visionModel}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Select a model that will be used specifically for processing
                    images. If left blank, your primary LLM model will be used
                    for both text and images (if it supports vision).
                  </Typography>

                  <Alert
                    severity="info"
                    sx={{
                      mt: 2,
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    }}
                  >
                    Vision models enable your bot to "see" and describe images
                    shared in Discord. Select a model that supports the{" "}
                    <b>vision</b> capability for best results.
                  </Alert>
                </Paper>
              </GridItem>

              <GridItem item xs={12}>
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  API keys for providers are managed securely by the backend
                  through environment variables. If you need to use a specific
                  provider, please ensure its API key is configured in the
                  server's environment.
                </Alert>
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveLLMSettings}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 1,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Image Generation Tab */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <GridItem item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={imageGenEnabled}
                      onChange={(e) => setImageGenEnabled(e.target.checked)}
                    />
                  }
                  label="Enable Image Generation"
                  sx={{ mb: 2 }}
                />
              </GridItem>

              <GridItem item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="image-provider-label">
                    Image Provider
                  </InputLabel>
                  <Select
                    labelId="image-provider-label"
                    value={imageProvider}
                    label="Image Provider"
                    onChange={(e) =>
                      setImageProvider(e.target.value as ImageProvider)
                    }
                    sx={{
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5, // Custom border radius for select
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <MenuItem value={ImageProvider.OPENAI}>
                      OpenAI DALL-E
                    </MenuItem>
                    <MenuItem value={ImageProvider.STABILITY}>
                      Stability AI
                    </MenuItem>
                    <MenuItem value={ImageProvider.MIDJOURNEY}>
                      Midjourney
                    </MenuItem>
                    <MenuItem value={ImageProvider.TOGETHER}>
                      Together AI
                    </MenuItem>
                    <MenuItem value={ImageProvider.CHUTES_HIDREAM}>
                      Chutes HiDream
                    </MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem item xs={12}>
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 1, // Custom border radius for alert
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  The bot will use your LLM provider's API key for image
                  generation if available (like with OpenAI). Custom API keys
                  for specific image providers can be configured in a future
                  update.
                </Alert>
              </GridItem>

              <GridItem item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="vision-model-label">Vision Model</InputLabel>
                  <Select
                    labelId="vision-model-label"
                    value={visionModel}
                    label="Vision Model"
                    onChange={(e) => setVisionModel(e.target.value)}
                    sx={{
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5, // Custom border radius for select
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <MenuItem value="openai/clip">OpenAI CLIP</MenuItem>
                    <MenuItem value="stability/stable-diffusion">
                      Stability Stable Diffusion
                    </MenuItem>
                    <MenuItem value="midjourney/v4">Midjourney V4</MenuItem>
                    <MenuItem value="together/vision">Together Vision</MenuItem>
                    <MenuItem value="chutes/hidream">Chutes HiDream</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveImageSettings}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 1, // Custom border radius for button
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={4}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {/* Avatar Section */}
              <GridItem item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Bot Avatar
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Avatar Preview */}
                    <Box
                      sx={{
                        width: 128,
                        height: 128,
                        borderRadius: "50%",
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        overflow: "hidden",
                        backgroundColor: alpha(theme.palette.grey[200], 0.7),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {avatarPreview ? (
                        <Box
                          component="img"
                          src={avatarPreview}
                          alt="Bot avatar preview"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={() => setAvatarPreview(null)}
                        />
                      ) : (
                        <BotIcon
                          sx={{
                            fontSize: 64,
                            color: alpha(theme.palette.text.secondary, 0.5),
                          }}
                        />
                      )}
                    </Box>

                    {/* Avatar URL Input */}
                    <Box
                      sx={{ flexGrow: 1, width: { xs: "100%", sm: "auto" } }}
                    >
                      <TextField
                        fullWidth
                        label="Avatar URL"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          setAvatarPreview(e.target.value);
                        }}
                        placeholder="https://example.com/avatar.png"
                        helperText="Enter URL to an image for the bot's profile picture (PNG, JPG, or WebP format recommended)"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: alpha(
                              theme.palette.common.white,
                              0.9
                            ),
                            borderRadius: 1.5,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Discord has a limit of 2 avatar changes per hour. If
                        changes don't apply immediately, try again later.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </GridItem>

              {/* Presence Status Section */}
              <GridItem item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Presence Status
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Online Status</InputLabel>
                  <Select
                    labelId="status-label"
                    value={presenceStatus}
                    label="Online Status"
                    onChange={(e) =>
                      setPresenceStatus(
                        e.target.value as
                          | "online"
                          | "idle"
                          | "dnd"
                          | "invisible"
                      )
                    }
                    sx={{
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <MenuItem value="online">Online</MenuItem>
                    <MenuItem value="idle">Idle</MenuItem>
                    <MenuItem value="dnd">Do Not Disturb</MenuItem>
                    <MenuItem value="invisible">Invisible</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              {/* Activity Type Section */}
              <GridItem item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Activity Type
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="activity-type-label">
                    Activity Type
                  </InputLabel>
                  <Select
                    labelId="activity-type-label"
                    value={activityType}
                    label="Activity Type"
                    onChange={(e) => setActivityType(Number(e.target.value))}
                    sx={{
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <MenuItem value={0}>Playing</MenuItem>
                    <MenuItem value={1}>Streaming</MenuItem>
                    <MenuItem value={2}>Listening to</MenuItem>
                    <MenuItem value={3}>Watching</MenuItem>
                    <MenuItem value={4}>Custom</MenuItem>
                    <MenuItem value={5}>Competing in</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              {/* Activity Name */}
              <GridItem item xs={12}>
                <TextField
                  fullWidth
                  label="Activity Text"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder={
                    activityType === 4
                      ? "Any custom status text"
                      : "e.g., Chess, Music, a movie, etc."
                  }
                  helperText={
                    activityType === 4
                      ? "With Custom activity type, this exact text will be displayed as your bot's status"
                      : "This will show as 'Playing Chess', 'Watching a movie', etc. based on the activity type"
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5,
                    },
                  }}
                />
              </GridItem>

              {/* Color Customization */}
              <GridItem item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    mb: 3,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Custom Colors
                  </Typography>
                  <Alert
                    severity="info"
                    sx={{
                      mb: 2,
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    }}
                  >
                    Custom colors are coming in a future update. Bot role colors
                    must be set directly in your Discord server settings.
                  </Alert>

                  {/* Placeholder for future color pickers */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      opacity: 0.5,
                      pointerEvents: "none",
                    }}
                  >
                    <TextField
                      label="Primary Color"
                      placeholder="#7289DA"
                      disabled
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      label="Accent Color"
                      placeholder="#43B581"
                      disabled
                      sx={{ flexGrow: 1 }}
                    />
                  </Box>
                </Paper>
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveAppearanceSettings}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 1,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Knowledge Tab */}
        <TabPanel value={tabValue} index={5}>
          <KnowledgeTab botId={id} />
        </TabPanel>

        {/* Tools Tab */}
        <TabPanel value={tabValue} index={6}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <GridItem item xs={12}>
                <Typography variant="h6" fontWeight={500} gutterBottom>
                  Tools Configuration
                </Typography>

                {!modelSupportsTools ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                      backgroundColor: alpha(theme.palette.warning.main, 0.02),
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <BuildIcon color="warning" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Tool Calling Not Supported
                      </Typography>
                    </Box>

                    <Typography variant="body2" paragraph>
                      The selected model <strong>{selectedModel}</strong> does
                      not support tool calling functionality.
                    </Typography>

                    <Typography variant="body2" paragraph>
                      To use tools, please select a model that supports the{" "}
                      <strong>tool_calling</strong> capability in the LLM
                      Settings tab.
                    </Typography>

                    <Alert
                      severity="info"
                      sx={{
                        mt: 2,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                      }}
                    >
                      A future update will add support for minimal tool
                      functionality with non-supported models using XML parsing.
                    </Alert>
                  </Paper>
                ) : (
                  <>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 1.5,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                        backgroundColor: alpha(
                          theme.palette.success.main,
                          0.02
                        ),
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <BuildIcon color="success" />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Tool Calling Supported
                        </Typography>
                      </Box>

                      <Typography variant="body2" paragraph>
                        The selected model <strong>{selectedModel}</strong>{" "}
                        supports native tool calling functionality. You can
                        configure tools below.
                      </Typography>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={toolsEnabled}
                            onChange={(e) => setToolsEnabled(e.target.checked)}
                          />
                        }
                        label="Enable Tools"
                        sx={{ mb: 2 }}
                      />
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 1.5,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.02
                        ),
                        mb: 3,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        Available Tools
                      </Typography>

                      <Typography variant="body2" paragraph>
                        Tool configuration will be available in a future update.
                        This will allow you to define custom function tools that
                        your bot can use.
                      </Typography>

                      <Alert
                        severity="info"
                        sx={{
                          mt: 2,
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                        }}
                      >
                        Examples of tools include: weather lookup, web search,
                        code execution, and more.
                      </Alert>
                    </Paper>
                  </>
                )}
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveToolSettings}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 1,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>
      </Paper>

      {/* Status Snackbar for Bot Actions */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={botActionInProgress ? null : 5000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          severity={
            botActionInProgress
              ? "info"
              : snackbarMessage.includes("Error")
                ? "error"
                : "success"
          }
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
          {botActionInProgress && (
            <CircularProgress size={16} sx={{ ml: 1, color: "white" }} />
          )}
        </Alert>
      </Snackbar>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Bot"
        message={`Are you sure you want to delete "${currentBot.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteBot}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Invite link dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>Add Bot to Server</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Use this link to add "{currentBot.name}" to your Discord server:
          </DialogContentText>
          <TextField
            fullWidth
            value={inviteUrl}
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            You need to have "Manage Server" permission on the Discord server to
            add this bot.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)} color="inherit">
            Close
          </Button>
          <Button
            onClick={copyInviteLink}
            color="primary"
            variant="contained"
            sx={{ borderRadius: 1 }}
          >
            Copy Link
          </Button>
          <Button
            onClick={() => window.open(inviteUrl, "_blank")}
            color="primary"
            variant="contained"
            endIcon={<LaunchIcon />}
            sx={{ borderRadius: 1 }}
          >
            Open Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Personality Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>Bot Personality Preview</DialogTitle>
        <DialogContent>
          <PersonalityPreview
            botName={name}
            systemPrompt={systemPrompt}
            personality={personality}
            traits={traits}
            backstory={backstory}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Register Commands Dialog */}
      <Dialog
        open={registerDialogOpen}
        onClose={() => !registrationInProgress && setRegisterDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>Register Discord Commands</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Register slash commands for {currentBot?.name}. You can register
            commands globally (available in all servers but may take up to an
            hour to propagate) or for a specific server (available immediately).
          </DialogContentText>

          <TextField
            fullWidth
            label="Server ID (Optional)"
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            placeholder="Enter a Server ID for instant registration"
            helperText={
              <span>
                Leave empty to register globally. To get a server ID, enable
                Developer Mode in Discord settings, then right-click on the
                server and select "Copy ID".
              </span>
            }
            disabled={registrationInProgress}
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            {guildId.trim() ? (
              <span>
                Commands will be registered immediately for server ID:{" "}
                <b>{guildId}</b>
              </span>
            ) : (
              <span>
                Commands will be registered globally. This can take up to an
                hour to propagate to all servers.
              </span>
            )}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRegisterDialogOpen(false)}
            disabled={registrationInProgress}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegisterCommands}
            variant="contained"
            disabled={registrationInProgress}
            startIcon={
              registrationInProgress ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <BoltIcon />
              )
            }
            sx={{ borderRadius: 1 }}
          >
            {registrationInProgress ? "Registering..." : "Register Commands"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BotDetail;
