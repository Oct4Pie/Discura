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
  Build as BuildIcon
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BotStatus, ImageProvider } from "../types";
import { LLMProvider } from "../api/";
import BotStatusBadge from "../components/BotStatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import { useBotStore } from "../stores/botStore";
import GridItem from "../components/GridItem";
import TabPanel from "../components/TabPanel";

const BotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(LLMProvider.OPENAI);
  const [llmModel, setLlmModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [imageGenEnabled, setImageGenEnabled] = useState(false);
  const [imageProvider, setImageProvider] = useState<ImageProvider>(ImageProvider.OPENAI);

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
      
      const provider = currentBot.configuration?.llmProvider || "openai";
      if (provider === "openai") {
        setLlmProvider(LLMProvider.OPENAI);
      } else if (provider === "anthropic") {
        setLlmProvider(LLMProvider.ANTHROPIC);
      } else if (provider === "google") {
        setLlmProvider(LLMProvider.GOOGLE);
      } else if (provider === "custom") {
        setLlmProvider(LLMProvider.CUSTOM);
      } else {
        setLlmProvider(LLMProvider.OPENAI);
      }
      
      setLlmModel(currentBot.configuration?.llmModel || "");
      setApiKey((currentBot.configuration as any)?.apiKey || "");
      setImageGenEnabled(currentBot.configuration?.imageGeneration?.enabled || false);
      setImageProvider((currentBot.configuration?.imageGeneration?.provider as ImageProvider) || ImageProvider.OPENAI);
    }
  }, [currentBot]);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
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
    try {
      await updateBot(id, { name });
      toast.success("Bot information updated");
    } catch (error) {
      toast.error("Failed to update bot information");
      console.error("Update bot error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonality = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    try {
      await updateBotConfiguration(id, {
        systemPrompt,
        personality,
        traits,
        backstory,
      });
      toast.success("Bot personality updated");
    } catch (error) {
      toast.error("Failed to update bot personality");
      console.error("Update personality error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLLMSettings = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    try {
      await updateBotConfiguration(id, {
        llmProvider,
        llmModel,
        apiKey,
      });
      toast.success("LLM settings updated");
    } catch (error) {
      toast.error("Failed to update LLM settings");
      console.error("Update LLM settings error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveImageSettings = async () => {
    if (!currentBot || !id) return;

    setSaving(true);
    try {
      await updateBotConfiguration(id, {
        imageGeneration: {
          enabled: imageGenEnabled,
          provider: imageProvider,
          apiKey: ((currentBot.configuration?.imageGeneration || {}) as any).apiKey || "",
          model: currentBot.configuration?.imageGeneration?.model || "",
        },
      });
      toast.success("Image generation settings updated");
    } catch (error) {
      toast.error("Failed to update image generation settings");
      console.error("Update image settings error:", error);
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
      toast.error("Failed to delete bot");
      console.error("Delete bot error:", error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleBotStatus = async () => {
    if (!currentBot || !id) return;

    try {
      if (currentBot.status === BotStatus.ONLINE) {
        await stopBot(id);
        toast.success("Bot stopped successfully");
      } else {
        await startBot(id);
        toast.success("Bot started successfully");
      }
    } catch (error) {
      toast.error(
        `Failed to ${currentBot.status === BotStatus.ONLINE ? "stop" : "start"} bot`
      );
      console.error("Toggle bot status error:", error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentBot) {
    return (
      <Alert 
        severity="error"
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
        }}
      >
        Bot not found. It may have been deleted or you don't have access to it.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          gap: 2,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <IconButton
            onClick={() => navigate('/bots')}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
              {currentBot.name}
            </Typography>
            <BotStatusBadge status={currentBot.status as BotStatus} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color={currentBot.status === BotStatus.ONLINE ? "error" : "success"}
            startIcon={currentBot.status === BotStatus.ONLINE ? <StopIcon /> : <StartIcon />}
            onClick={handleToggleBotStatus}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: `0 4px 12px ${alpha(
                currentBot.status === BotStatus.ONLINE 
                  ? theme.palette.error.main 
                  : theme.palette.success.main, 
                0.2
              )}`,
            }}
          >
            {currentBot.status === BotStatus.ONLINE ? "Stop Bot" : "Start Bot"}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              borderWidth: 1.5,
              borderRadius: 2,
              '&:hover': {
                borderWidth: 1.5,
              }
            }}
          >
            Delete Bot
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          aria-label="bot configuration tabs"
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '& .MuiTab-root': {
              py: 2,
              px: 3,
              minHeight: 'unset',
            }
          }}
        >
          <Tab icon={<SettingsIcon sx={{ mb: 0.5 }} />} label="Basic Info" iconPosition="top" />
          <Tab icon={<PersonIcon sx={{ mb: 0.5 }} />} label="Personality" iconPosition="top" />
          <Tab icon={<CodeIcon sx={{ mb: 0.5 }} />} label="LLM Settings" iconPosition="top" />
          <Tab icon={<ImageIcon sx={{ mb: 0.5 }} />} label="Image Generation" iconPosition="top" />
          <Tab icon={<BookIcon sx={{ mb: 0.5 }} />} label="Knowledge" iconPosition="top" disabled />
          <Tab icon={<BuildIcon sx={{ mb: 0.5 }} />} label="Tools" iconPosition="top" disabled />
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
                  }}
                />
              </GridItem>

              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Application ID"
                  value={currentBot.applicationId}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
                  }}
                />
              </GridItem>

              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Discord Token"
                  value={currentBot.discordToken}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  helperText="For security, the token is masked"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
                  }}
                />
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveBasicInfo}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 2,
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
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
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
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
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
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Add Trait
                        </Button>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.common.white, 0.9),
                      }
                    }}
                  />
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {traits.map((trait) => (
                      <Chip
                        key={trait}
                        label={trait}
                        onDelete={() => handleRemoveTrait(trait)}
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          borderWidth: 1.5,
                          '& .MuiChip-deleteIcon': {
                            color: theme.palette.primary.main,
                          }
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
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
                  }}
                />
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePersonality}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 2,
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
              <GridItem item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="llm-provider-label">LLM Provider</InputLabel>
                  <Select
                    labelId="llm-provider-label"
                    value={llmProvider}
                    label="LLM Provider"
                    onChange={(e) => setLlmProvider(e.target.value as LLMProvider)}
                    sx={{
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }}
                  >
                    <MenuItem value={LLMProvider.OPENAI}>OpenAI</MenuItem>
                    <MenuItem value={LLMProvider.ANTHROPIC}>Anthropic</MenuItem>
                    <MenuItem value={LLMProvider.GOOGLE}>Google</MenuItem>
                    <MenuItem value={LLMProvider.CUSTOM}>Custom</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  placeholder={
                    llmProvider === LLMProvider.OPENAI
                      ? "gpt-3.5-turbo"
                      : llmProvider === LLMProvider.ANTHROPIC
                      ? "claude-3-sonnet-20240229"
                      : llmProvider === LLMProvider.GOOGLE
                      ? "gemini-pro"
                      : "API endpoint URL"
                  }
                  helperText={
                    llmProvider === LLMProvider.CUSTOM
                      ? "For custom providers, enter the API endpoint"
                      : "The model to use for this bot"
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
                  }}
                />
              </GridItem>

              <GridItem item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your LLM provider API key"
                  helperText="Your API key will be encrypted in our database"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }
                  }}
                />
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveLLMSettings}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 2,
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
            <FormControlLabel
              control={
                <Switch
                  checked={imageGenEnabled}
                  onChange={(e) => setImageGenEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Enable Image Generation"
              sx={{ mb: 3 }}
            />

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                opacity: imageGenEnabled ? 1 : 0.5,
                pointerEvents: imageGenEnabled ? "auto" : "none",
              }}
            >
              <GridItem item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="image-provider-label">Image Provider</InputLabel>
                  <Select
                    labelId="image-provider-label"
                    value={imageProvider}
                    label="Image Provider"
                    onChange={(e) => setImageProvider(e.target.value as ImageProvider)}
                    sx={{
                      backgroundColor: alpha(theme.palette.common.white, 0.9),
                    }}
                  >
                    <MenuItem value={ImageProvider.OPENAI}>OpenAI DALL-E</MenuItem>
                    <MenuItem value={ImageProvider.STABILITY}>Stability AI</MenuItem>
                    <MenuItem value={ImageProvider.MIDJOURNEY}>Midjourney</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem item xs={12}>
                <Alert 
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  The bot will use your LLM provider's API key for image generation if available (like with OpenAI).
                  Custom API keys for specific image providers can be configured in a future update.
                </Alert>
              </GridItem>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveImageSettings}
                disabled={saving}
                sx={{
                  px: 3,
                  borderRadius: 2,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>
      </Paper>

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
    </Box>
  );
};

export default BotDetail;
