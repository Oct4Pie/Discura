import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
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
import { LLMProvider, BotsService, ImageProvider, UpdateBotConfigurationRequestDto, BotConfiguration, LlmService } from "../api/";
import { handleApiError } from "../api"; // Import error handler
import BotStatusBadge from "../components/BotStatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import GridItem from "../components/GridItem";
import TabPanel from "../components/TabPanel";
import ValidationErrorDisplay from "../components/ValidationErrorDisplay"; // Import validation error display
import { useBotStore } from "../stores/botStore";
import PersonalityPreview from "../components/PersonalityPreview";
import ModelSelector from "../components/ModelSelector";

// Function to extract provider and model from combined format
const parseModelId = (combinedModelId: string): { provider: string; model: string } => {
  if (!combinedModelId || !combinedModelId.includes('/')) {
    // Default for invalid format
    return { provider: 'openai', model: 'gpt-3.5-turbo' };
  }

  // Find the index of the first slash
  const firstSlashIndex = combinedModelId.indexOf('/');
  // Provider is everything before the first slash
  const provider = combinedModelId.substring(0, firstSlashIndex);
  // Model is everything after the first slash (including any additional slashes)
  const model = combinedModelId.substring(firstSlashIndex + 1);

  return { provider, model };
};

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

  // Form state
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [personality, setPersonality] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState("");
  const [backstory, setBackstory] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-4o-mini");
  const [imageGenEnabled, setImageGenEnabled] = useState(false);
  const [imageProvider, setImageProvider] = useState<ImageProvider>(ImageProvider.OPENAI);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

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
      
      // Set selected model properly using provider and model
      if (currentBot.configuration?.llmProvider && currentBot.configuration?.llmModel) {
        setSelectedModel(`${currentBot.configuration.llmProvider}/${currentBot.configuration.llmModel}`);
      } else {
        setSelectedModel("openai/gpt-4o-mini"); // default
      }

      setImageGenEnabled(currentBot.configuration?.imageGeneration?.enabled || false);
      
      if (currentBot.configuration?.imageGeneration?.provider) {
        setImageProvider(currentBot.configuration.imageGeneration.provider);
      } else {
        setImageProvider(ImageProvider.OPENAI);
      }
    }
  }, [currentBot]);

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
        configuration: updatedConfig
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
      // Instead of manually parsing the model string, fetch all available models 
      // to find the correct provider for the selected model
      const allProvidersResponse = await LlmService.getAllProviderModels();
      
      // Find the model in the response
      let matchedProvider: string | undefined;
      let matchedModelName: string | undefined;
      
      // Search all providers to find which one contains our selected model
      for (const providerData of allProvidersResponse.providers) {
        const foundModel = providerData.models.find(model => model.id === selectedModel);
        if (foundModel) {
          matchedProvider = providerData.provider;
          
          // The model ID is in format "provider/model-name"
          // The backend expects just the model name in the llmModel field,
          // so we use the provider_model_id if available
          matchedModelName = foundModel.provider_model_id || selectedModel;
          break;
        }
      }
      
      // If we couldn't find the model in the API response, fall back to the current selection
      // without any parsing
      if (!matchedProvider) {
        console.warn(`Could not find model ${selectedModel} in the API response. Using the model ID as-is.`);
      }
      
      // Create a new configuration object that retains all existing config values
      const updatedConfig: BotConfiguration = {
        ...currentBot.configuration,
        // Use the identified provider if found, otherwise keep the current provider
        llmProvider: (matchedProvider as LLMProvider) || currentBot.configuration?.llmProvider,
        // Use the full selected model ID directly from the UI or ModelSelector
        llmModel: selectedModel,
      };
      
      // Use the typed DTO for the update
      const configUpdate: UpdateBotConfigurationRequestDto = {
        configuration: updatedConfig
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
      // Create a new configuration object that retains all existing config values
      // but updates the image generation fields
      const updatedConfig: BotConfiguration = {
        ...currentBot.configuration,
        imageGeneration: {
          enabled: imageGenEnabled,
          provider: imageProvider,
        },
      };
      
      // Use the typed DTO for the update
      const configUpdate: UpdateBotConfigurationRequestDto = {
        configuration: updatedConfig
      };
      
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
    } catch (error: any) {
      // Set validation error for display in the UI
      setValidationError(error);
      
      const errorMessage =
        error?.response?.data?.message ||
        `Failed to ${currentBot.status === BotStatus.ONLINE ? "stop" : "start"} bot`;
      
      // Still keep toast for immediate feedback
      toast.error(errorMessage);
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

          <Button
            variant="contained"
            color={currentBot.status === BotStatus.ONLINE ? "error" : "success"}
            startIcon={
              botActionInProgress ? (
                <CircularProgress size={20} color="inherit" />
              ) : currentBot.status === BotStatus.ONLINE ? (
                <StopIcon />
              ) : (
                <StartIcon />
              )
            }
            onClick={handleToggleBotStatus}
            disabled={
              botActionInProgress || currentBot.status === BotStatus.ERROR
            }
            sx={{
              px: 3,
              py: 1,
              borderRadius: 1, // Custom border radius for button
              boxShadow: `0 4px 12px ${alpha(
                currentBot.status === BotStatus.ONLINE
                  ? theme.palette.error.main
                  : theme.palette.success.main,
                0.2
              )}`,
            }}
          >
            {botActionInProgress
              ? currentBot.status === BotStatus.ONLINE
                ? "Stopping..."
                : "Starting..."
              : currentBot.status === BotStatus.ONLINE
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
            icon={<BookIcon sx={{ mb: 0.5 }} />}
            label="Knowledge"
            iconPosition="top"
            disabled
          />
          <Tab
            icon={<BuildIcon sx={{ mb: 0.5 }} />}
            label="Tools"
            iconPosition="top"
            disabled
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

        {/* Personality Tab */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <GridItem item xs={12}>
                <Box
                  sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}
                >
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

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="System Prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Instructions for the AI on how to behave and respond"
                  helperText="This is the primary instruction set that defines your bot's behavior"
                  InputLabelProps={{ shrink: true }}
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
                  label="Personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="e.g., Friendly, Sarcastic, Professional"
                  helperText="A short description of your bot's personality"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5, // Custom border radius for text field
                    },
                  }}
                />
              </GridItem>

              <GridItem item xs={12} md={6}>
                <Box>
                  <TextField
                    fullWidth
                    label="Traits"
                    value={newTrait}
                    onChange={(e) => setNewTrait(e.target.value)}
                    placeholder="Add personality traits"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTrait();
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <Button
                          variant="text"
                          onClick={handleAddTrait}
                          disabled={!newTrait}
                          sx={{
                            whiteSpace: "nowrap",
                            borderRadius: 1, // Custom border radius for button
                          }}
                        >
                          Add Trait
                        </Button>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: alpha(theme.palette.common.white, 0.9),
                        borderRadius: 1.5, // Custom border radius for text field
                      },
                    }}
                  />
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {traits.map((trait) => (
                      <Chip
                        key={trait}
                        label={trait}
                        onDelete={() => handleRemoveTrait(trait)}
                        color="primary"
                        variant="outlined"
                        sx={{
                          borderRadius: 1, // Custom border radius for chip
                          borderWidth: 1.5,
                          "& .MuiChip-deleteIcon": {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </GridItem>

              <GridItem item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Backstory"
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="The background and history of your bot"
                  helperText="Give your bot a rich backstory to enhance its character"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                      borderRadius: 1.5, // Custom border radius for text field
                    },
                  }}
                />
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
                <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                  LLM Provider and Model
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
                  Select the AI model that powers your bot's responses. This
                  determines the capabilities and quality of your bot.
                </Typography>
              </GridItem>

              <GridItem item xs={12}>
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 1, // Custom border radius for alert
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
                  borderRadius: 1, // Custom border radius for button
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
    </Box>
  );
};

export default BotDetail;
