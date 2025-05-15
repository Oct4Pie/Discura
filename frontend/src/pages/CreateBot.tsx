import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  useTheme,
  Paper,
  Tooltip,
  IconButton,
  InputAdornment,
  Container,
  Fade,
  Divider,
  Step,
  StepLabel,
  Stepper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
} from "@mui/material";
import {
  SmartToy as BotIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  TokenOutlined as TokenIcon,
  Launch as LaunchIcon,
  CheckCircleOutline as CheckIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Psychology as PersonalityIcon,
  AutoStories as BackstoryIcon,
  SentimentSatisfiedAlt as TraitsIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useBotStore } from "../stores/botStore";
import {
  LLMProvider,
  ImageProvider,
  CreateBotRequestDto,
  BotConfiguration,
} from "../api/";
import { validate } from "../utils/validation";
import type { SelectChangeEvent } from "@mui/material/Select";
import ModelSelector from "../components/ModelSelector";

const PERSONALITY_TEMPLATES = {
  FRIENDLY: {
    name: "Friendly Helper",
    systemPrompt:
      "You are a friendly and helpful assistant who always maintains a positive attitude. Your goal is to assist users with their questions and tasks in a cheerful and supportive manner.",
    personality: "Friendly, helpful, enthusiastic, and positive",
    traits: ["Helpful", "Cheerful", "Patient", "Supportive"],
    backstory:
      "You were created to bring a helpful and positive presence to the Discord server. Your approach is friendly, and you enjoy making users feel welcome and supported.",
  },
  PROFESSIONAL: {
    name: "Professional Assistant",
    systemPrompt:
      "You are a professional assistant focusing on providing accurate, concise, and valuable information. You maintain a respectful tone while delivering expert advice and solutions.",
    personality: "Professional, knowledgeable, precise, and formal",
    traits: ["Knowledgeable", "Efficient", "Precise", "Formal"],
    backstory:
      "You were designed to serve as a professional resource, offering expert guidance and information. You value accuracy and efficiency in all your interactions.",
  },
  HUMOROUS: {
    name: "Witty Comedian",
    systemPrompt:
      "You are a bot with a great sense of humor. While being helpful, you incorporate wit, jokes, and playful banter into your responses to make interactions entertaining and engaging.",
    personality: "Humorous, witty, playful, and entertaining",
    traits: ["Funny", "Creative", "Witty", "Playful"],
    backstory:
      "You were programmed to bring joy and laughter to conversations. You believe that a good laugh can brighten anyone's day, so you try to incorporate humor into your helpful responses.",
  },
  EDUCATOR: {
    name: "Educational Guide",
    systemPrompt:
      "You are an educational assistant who loves to teach and explain concepts clearly. You break down complex topics into understandable parts and encourage a growth mindset.",
    personality: "Educational, patient, encouraging, and thorough",
    traits: ["Educational", "Patient", "Thorough", "Encouraging"],
    backstory:
      "You were created with a passion for sharing knowledge. You enjoy helping users understand complex topics and believe in making learning accessible and enjoyable for everyone.",
  },
  CUSTOM: {
    name: "Custom Personality",
    systemPrompt: "",
    personality: "",
    traits: [],
    backstory: "",
  },
};

const AVAILABLE_TRAITS = [
  "Helpful",
  "Cheerful",
  "Patient",
  "Supportive",
  "Knowledgeable",
  "Efficient",
  "Precise",
  "Formal",
  "Funny",
  "Creative",
  "Witty",
  "Playful",
  "Educational",
  "Thorough",
  "Encouraging",
  "Compassionate",
  "Empathetic",
  "Analytical",
  "Strategic",
  "Technical",
  "Motivational",
  "Curious",
  "Resourceful",
  "Adaptable",
  "Diplomatic",
];

const CreateBot = () => {
  const navigate = useNavigate();
  const { createBot, isLoading } = useBotStore();
  const theme = useTheme();

  // Basic info
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [nameError, setNameError] = useState("");
  const [tokenError, setTokenError] = useState("");

  // Personality settings
  const [activeStep, setActiveStep] = useState(0);
  const [personalityTemplate, setPersonalityTemplate] = useState("FRIENDLY");
  const [systemPrompt, setSystemPrompt] = useState(
    PERSONALITY_TEMPLATES.FRIENDLY.systemPrompt
  );
  const [personality, setPersonality] = useState(
    PERSONALITY_TEMPLATES.FRIENDLY.personality
  );
  const [traits, setTraits] = useState<string[]>(
    PERSONALITY_TEMPLATES.FRIENDLY.traits
  );
  const [backstory, setBackstory] = useState(
    PERSONALITY_TEMPLATES.FRIENDLY.backstory
  );

  // Model selection using combined format
  const [selectedModel, setSelectedModel] = useState<string>(
    "openai/gpt-3.5-turbo"
  );

  const validateCurrentStep = () => {
    if (activeStep === 0) {
      let isValid = true;

      if (!validate.required(name)) {
        setNameError("Bot name is required");
        isValid = false;
      } else if (!validate.minLength(name, 3)) {
        setNameError("Bot name must be at least 3 characters");
        isValid = false;
      } else {
        setNameError("");
      }

      if (!validate.required(token)) {
        setTokenError("Discord Token is required");
        isValid = false;
      } else {
        setTokenError("");
      }

      return isValid;
    }

    if (activeStep === 1) {
      // Validate system prompt
      return validate.minLength(systemPrompt, 10);
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBackStep = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleTemplateChange = (event: SelectChangeEvent<string>) => {
    const templateKey = event.target.value as string;
    setPersonalityTemplate(templateKey);

    const template =
      PERSONALITY_TEMPLATES[templateKey as keyof typeof PERSONALITY_TEMPLATES];
    setSystemPrompt(template.systemPrompt);
    setPersonality(template.personality);
    setTraits(template.traits);
    setBackstory(template.backstory);
  };

  const handleTraitChange = (event: SelectChangeEvent<string[]>) => {
    setTraits(event.target.value as string[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    try {
      // Create a properly typed configuration object
      const configuration: BotConfiguration = {
        systemPrompt,
        personality,
        traits,
        backstory,
        // Use the model ID directly from ModelSelector without parsing
        llmModel: selectedModel,
        // We need to provide a valid LLMProvider value to satisfy the type system
        // The actual provider will be extracted from the model ID by the backend
        llmProvider: LLMProvider.OPENAI,
        apiKey: "", // API key will be set in the detailed view
        imageGeneration: {
          enabled: false,
          provider: ImageProvider.OPENAI,
        },
        toolsEnabled: false,
        tools: [],
        knowledge: [],
        visionModel: "", // Adding required visionModel property with default empty string
        visionProvider: "", // Adding required visionProvider property with default empty string
      };

      // Create a properly typed request DTO
      const botData: CreateBotRequestDto = {
        name: name.trim(),
        discordToken: token.trim(),
        configuration,
      };

      const bot = await createBot(botData);

      toast.success(
        "Bot created successfully! You can now customize its settings further."
      );

      if (bot?.id) {
        navigate(`/bots/${bot.id}`);
      } else {
        navigate("/bots");
      }
    } catch (error) {
      console.error("Error creating bot:", error);
      toast.error("Failed to create bot. Please try again.");
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Basic Info
        return (
          <>
            <TextField
              fullWidth
              label="Bot Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              error={!!nameError}
              helperText={nameError || "Choose a descriptive name for your bot"}
              disabled={isLoading}
              autoFocus
              sx={{
                mb: 4,
                ".MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  transition: theme.transitions.create(["box-shadow"]),
                  "&:hover, &.Mui-focused": {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BotIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Discord Bot Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              margin="normal"
              error={!!tokenError}
              helperText={
                tokenError ||
                "Enter your Discord bot token from the Developer Portal"
              }
              disabled={isLoading}
              type="password"
              sx={{
                mb: 4,
                ".MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  transition: theme.transitions.create(["box-shadow"]),
                  "&:hover, &.Mui-focused": {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TokenIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip
                      title="You can find your bot token in the Discord Developer Portal under the 'Bot' section"
                      placement="top"
                      arrow
                    >
                      <IconButton edge="end" size="small" tabIndex={-1}>
                        <HelpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </>
        );

      case 1: // Personality
        return (
          <>
            <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel id="personality-template-label">
                Personality Template
              </InputLabel>
              <Select
                labelId="personality-template-label"
                value={personalityTemplate}
                onChange={handleTemplateChange}
                label="Personality Template"
                sx={{ borderRadius: 1.5 }}
              >
                <MenuItem value="FRIENDLY">Friendly Helper</MenuItem>
                <MenuItem value="PROFESSIONAL">Professional Assistant</MenuItem>
                <MenuItem value="HUMOROUS">Witty Comedian</MenuItem>
                <MenuItem value="EDUCATOR">Educational Guide</MenuItem>
                <MenuItem value="CUSTOM">Custom Personality</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="System Prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              margin="normal"
              multiline
              rows={4}
              helperText="This system prompt guides how your bot responds"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment
                    position="start"
                    sx={{ alignSelf: "flex-start", mt: 1.5 }}
                  >
                    <PersonalityIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Personality Description"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              margin="normal"
              helperText="Describe your bot's personality traits (e.g., friendly, professional, witty)"
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel id="traits-label">Personality Traits</InputLabel>
              <Select
                labelId="traits-label"
                multiple
                value={traits}
                onChange={handleTraitChange}
                input={<OutlinedInput label="Personality Traits" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {AVAILABLE_TRAITS.map((trait) => (
                  <MenuItem key={trait} value={trait}>
                    {trait}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        );

      case 2: // Backstory and Model
        return (
          <>
            <TextField
              fullWidth
              label="Character Backstory"
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              margin="normal"
              multiline
              rows={4}
              helperText="Give your bot a backstory to help shape its responses"
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment
                    position="start"
                    sx={{ alignSelf: "flex-start", mt: 1.5 }}
                  >
                    <BackstoryIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                Select LLM Provider and Model
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
                Choose the AI model that powers your bot's responses. You can
                change this later.
              </Typography>
            </Box>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Fade in={true} timeout={450}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header with back button and title */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            mb: { xs: 4, md: 5 },
            mt: 1,
          }}
        >
          <IconButton
            onClick={() => navigate("/bots")}
            size="large"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.16),
                transform: "translateX(-2px)",
              },
              transition: theme.transitions.create(
                ["transform", "background-color"],
                {
                  duration: theme.transitions.duration.shorter,
                }
              ),
              color: theme.palette.primary.main,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.12)}`,
            }}
            aria-label="Back to bots"
          >
            <ArrowBackIcon />
          </IconButton>

          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              sx={{
                mb: 0.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Create a New Bot
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Set up your Discord bot in just a few steps
            </Typography>
          </Box>
        </Box>

        {/* Multi-step progress indicator */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step>
              <StepLabel>Basic Details</StepLabel>
            </Step>
            <Step>
              <StepLabel>Personality</StepLabel>
            </Step>
            <Step>
              <StepLabel>Backstory & Model</StepLabel>
            </Step>
          </Stepper>
        </Box>

        {/* Main Card with Bot Details Form */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            mb: 4,
            position: "relative",
            overflow: "visible",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {renderStepContent()}

              <Box
                sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}
              >
                <Button
                  variant="outlined"
                  onClick={handleBackStep}
                  startIcon={<BackIcon />}
                  disabled={activeStep === 0 || isLoading}
                  sx={{
                    borderRadius: 1.5,
                    visibility: activeStep === 0 ? "hidden" : "visible",
                  }}
                >
                  Back
                </Button>

                {activeStep < 2 ? (
                  <Button
                    variant="contained"
                    onClick={handleNextStep}
                    endIcon={<NextIcon />}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 1.5,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                      fontWeight: 600,
                      ml: "auto",
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    sx={{
                      py: 1.2,
                      px: 4,
                      borderRadius: 1.5,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                      fontWeight: 600,
                      transition: theme.transitions.create([
                        "box-shadow",
                        "transform",
                      ]),
                      "&:hover": {
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    {isLoading ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={20} color="inherit" />
                        <Typography variant="button" sx={{ fontWeight: 600 }}>
                          Creating...
                        </Typography>
                      </Box>
                    ) : (
                      "Create Bot"
                    )}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Discord Bot Setup Guide */}
        <Paper
          elevation={0}
          sx={{
            p: 3.5,
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.background.paper, 0.6)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            borderRadius: 2,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.04)}`,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            color="primary.main"
            sx={{ mb: 2 }}
          >
            Discord Bot Setup Guide
          </Typography>

          <Stepper orientation="vertical" sx={{ mb: 2 }}>
            <Step active={true} completed={true}>
              <StepLabel
                StepIconProps={{
                  icon: <CheckIcon color="primary" />,
                  sx: { color: theme.palette.primary.main },
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>
                  Create a Discord Application
                </Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Go to the Discord Developer Portal and create a new
                  application.
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  startIcon={<LaunchIcon fontSize="small" />}
                  sx={{
                    mt: 1,
                    borderRadius: 1,
                  }}
                >
                  Discord Developer Portal
                </Button>
              </Box>
            </Step>

            <Step active={true} completed={true}>
              <StepLabel
                StepIconProps={{
                  icon: <CheckIcon color="primary" />,
                  sx: { color: theme.palette.primary.main },
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>
                  Add a Bot to Your Application
                </Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  In your application dashboard, go to the "Bot" tab and click
                  "Add Bot".
                </Typography>
              </Box>
            </Step>

            <Step active={true} completed={true}>
              <StepLabel
                StepIconProps={{
                  icon: <CheckIcon color="primary" />,
                  sx: { color: theme.palette.primary.main },
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>
                  Enable Message Content Intent
                </Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  In the Bot settings, scroll down to "Privileged Gateway
                  Intents" and enable "Message Content Intent".
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontStyle: "italic" }}
                >
                  This is required for your bot to read and respond to messages.
                </Typography>
              </Box>
            </Step>

            <Step active={true}>
              <StepLabel
                StepIconProps={{
                  icon: <CheckIcon color="primary" />,
                  sx: { color: theme.palette.primary.main },
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>Copy Your Bot Token</Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  In the Bot settings, click "Reset Token" to generate a new
                  token or "Copy" to copy your existing token.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.warning.dark, mt: 1 }}
                >
                  Keep your token secret! Anyone with your token can control
                  your bot.
                </Typography>
              </Box>
            </Step>
          </Stepper>

          <Divider sx={{ my: 2.5, opacity: 0.6 }} />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: "50%",
                p: 0.8,
                mr: 2,
              }}
            >
              <TokenIcon color="primary" fontSize="small" />
            </Box>
            <Typography variant="body2" color="text.primary">
              After completing these steps, paste your token above to connect
              your Discord bot.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Fade>
  );
};

export default CreateBot;
