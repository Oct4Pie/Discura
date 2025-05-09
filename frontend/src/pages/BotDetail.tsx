import {
    Delete as DeleteIcon,
    Save as SaveIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
} from '@mui/icons-material';
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
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BotStatus, LLMProvider } from '@discura/common/types';
import {TabPanelProps} from '../types';
import BotStatusBadge from '../components/BotStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBotStore } from '../stores/botStore';
import GridItem from '../components/GridItem';

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bot-tabpanel-${index}`}
      aria-labelledby={`bot-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// Define a type for the image provider to ensure type safety
type ImageProvider = 'openai' | 'stability' | 'midjourney';

const BotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { currentBot, fetchBot, updateBot, deleteBot, startBot, stopBot, isLoading, updateBotConfiguration } = useBotStore();
  
  // Form state
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [personality, setPersonality] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState('');
  const [backstory, setBackstory] = useState('');
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(LLMProvider.OPENAI);
  const [llmModel, setLlmModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [imageGenEnabled, setImageGenEnabled] = useState(false);
  const [imageProvider, setImageProvider] = useState<ImageProvider>('openai');
  
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
      setSystemPrompt(currentBot.configuration?.systemPrompt || '');
      setPersonality(currentBot.configuration?.personality || '');
      setTraits(currentBot.configuration?.traits || []);
      setBackstory(currentBot.configuration?.backstory || '');
      // Cast the llmProvider to LLMProvider enum to fix the type error
      setLlmProvider((currentBot.configuration?.llmProvider as LLMProvider) || LLMProvider.OPENAI);
      setLlmModel(currentBot.configuration?.llmModel || '');
      // Use optional chaining and type assertion to handle potential missing apiKey
      setApiKey((currentBot.configuration as any)?.apiKey || '');
      setImageGenEnabled(currentBot.configuration?.imageGeneration?.enabled || false);
      setImageProvider((currentBot.configuration?.imageGeneration?.provider as ImageProvider) || 'openai');
    }
  }, [currentBot]);
  
  // Handle tab change - removed unused event parameter
  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Add trait
  const handleAddTrait = () => {
    if (newTrait && !traits.includes(newTrait)) {
      setTraits([...traits, newTrait]);
      setNewTrait('');
    }
  };
  
  // Remove trait
  const handleRemoveTrait = (traitToRemove: string) => {
    setTraits(traits.filter(trait => trait !== traitToRemove));
  };
  
  // Save basic info
  const handleSaveBasicInfo = async () => {
    if (!currentBot || !id) return;
    
    setSaving(true);
    try {
      await updateBot(id, { name });
      toast.success('Bot information updated');
    } catch (error) {
      toast.error('Failed to update bot information');
      console.error('Update bot error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Save personality
  const handleSavePersonality = async () => {
    if (!currentBot || !id) return;
    
    setSaving(true);
    try {
      await updateBotConfiguration(id, {
        systemPrompt,
        personality,
        traits,
        backstory
      });
      toast.success('Bot personality updated');
    } catch (error) {
      toast.error('Failed to update bot personality');
      console.error('Update personality error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Save LLM settings
  const handleSaveLLMSettings = async () => {
    if (!currentBot || !id) return;
    
    setSaving(true);
    try {
      await updateBotConfiguration(id, {
        llmProvider,
        llmModel,
        apiKey
      });
      toast.success('LLM settings updated');
    } catch (error) {
      toast.error('Failed to update LLM settings');
      console.error('Update LLM settings error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Save image generation settings
  const handleSaveImageSettings = async () => {
    if (!currentBot || !id) return;
    
    setSaving(true);
    try {
      // Define an interface extension to include apiKey property
      interface ImageGenerationConfig {
        enabled: boolean;
        provider: string;
        apiKey?: string;
        model?: string;
      }
      
      await updateBotConfiguration(id, {
        imageGeneration: {
          enabled: imageGenEnabled,
          provider: imageProvider,
          // Safely access apiKey using type assertion
          apiKey: ((currentBot.configuration?.imageGeneration || {}) as any).apiKey || '',
          model: currentBot.configuration?.imageGeneration?.model || ''
        } as ImageGenerationConfig
      });
      toast.success('Image generation settings updated');
    } catch (error) {
      toast.error('Failed to update image generation settings');
      console.error('Update image settings error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Delete bot
  const handleDeleteBot = async () => {
    if (!id) return;
    
    try {
      await deleteBot(id);
      toast.success('Bot deleted successfully');
      navigate('/bots');
    } catch (error) {
      toast.error('Failed to delete bot');
      console.error('Delete bot error:', error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  // Start/stop bot
  const handleToggleBotStatus = async () => {
    if (!currentBot || !id) return;
    
    try {
      if (currentBot.status === BotStatus.ONLINE) {
        await stopBot(id);
        toast.success('Bot stopped successfully');
      } else {
        await startBot(id);
        toast.success('Bot started successfully');
      }
    } catch (error) {
      toast.error(`Failed to ${currentBot.status === BotStatus.ONLINE ? 'stop' : 'start'} bot`);
      console.error('Toggle bot status error:', error);
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!currentBot) {
    return (
      <Alert severity="error">
        Bot not found. It may have been deleted or you don't have access to it.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {currentBot.name}
          </Typography>
          <BotStatusBadge status={currentBot.status as BotStatus} />
        </Box>
        
        <Box>
          <Button
            variant="contained"
            color={currentBot.status === BotStatus.ONLINE ? 'error' : 'success'}
            startIcon={currentBot.status === BotStatus.ONLINE ? <StopIcon /> : <StartIcon />}
            onClick={handleToggleBotStatus}
            sx={{ mr: 2 }}
          >
            {currentBot.status === BotStatus.ONLINE ? 'Stop Bot' : 'Start Bot'}
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Bot
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleChangeTab} aria-label="bot configuration tabs">
          <Tab label="Basic Info" />
          <Tab label="Personality" />
          <Tab label="LLM Settings" />
          <Tab label="Image Generation" />
          <Tab label="Knowledge" disabled />
          <Tab label="Tools" disabled />
        </Tabs>
        
        {/* Basic Info */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bot Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </GridItem>
              
              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Application ID"
                  value={currentBot.applicationId}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </GridItem>
              
              <GridItem item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Discord Token"
                  value={currentBot.discordToken}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="For security, the token is masked"
                />
              </GridItem>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveBasicInfo}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>
        
        {/* Personality */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
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
                      if (e.key === 'Enter') {
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
                        >
                          Add
                        </Button>
                      ),
                    }}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {traits.map((trait) => (
                      <Chip 
                        key={trait}
                        label={trait}
                        onDelete={() => handleRemoveTrait(trait)}
                        color="primary"
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
                />
              </GridItem>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePersonality}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>
        
        {/* LLM Settings */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <GridItem item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="llm-provider-label">LLM Provider</InputLabel>
                  <Select
                    labelId="llm-provider-label"
                    value={llmProvider}
                    label="LLM Provider"
                    onChange={(e) => setLlmProvider(e.target.value as LLMProvider)}
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
                  placeholder={llmProvider === LLMProvider.OPENAI ? "gpt-3.5-turbo" : 
                    llmProvider === LLMProvider.ANTHROPIC ? "claude-3-sonnet-20240229" : 
                    llmProvider === LLMProvider.GOOGLE ? "gemini-pro" : 
                    "API endpoint URL"}
                  helperText={llmProvider === LLMProvider.CUSTOM ? "For custom providers, enter the API endpoint" : "The model to use for this bot"}
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
                />
              </GridItem>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveLLMSettings}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>
        
        {/* Image Generation */}
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
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, opacity: imageGenEnabled ? 1 : 0.5, pointerEvents: imageGenEnabled ? 'auto' : 'none' }}>
              <GridItem item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="image-provider-label">Image Provider</InputLabel>
                  <Select
                    labelId="image-provider-label"
                    value={imageProvider}
                    label="Image Provider"
                    onChange={(e) => setImageProvider(e.target.value as ImageProvider)}
                  >
                    <MenuItem value="openai">OpenAI DALL-E</MenuItem>
                    <MenuItem value="stability">Stability AI</MenuItem>
                    <MenuItem value="midjourney">Midjourney</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem item xs={12}>
                <Alert severity="info">
                  The bot will use your LLM provider's API key for image generation if available (like with OpenAI).
                  Custom API keys for specific image providers can be configured in a future update.
                </Alert>
              </GridItem>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveImageSettings}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
