import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Step,
  StepLabel,
  Stepper,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { SmartToy as BotIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useBotStore } from "../stores/botStore";
import GridItem from "../components/GridItem";
import { LLMProvider, ImageProvider } from "../api";

const BotCreate = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { createBot, validateToken, isLoading: storeLoading } = useBotStore();

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [botName, setBotName] = useState("");
  const [discordToken, setDiscordToken] = useState("");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const [applicationId, setApplicationId] = useState("");

  // Personality defaults
  const defaultSystemPrompt =
    "You are a helpful Discord bot assistant named {{botName}}. Be friendly, concise, and helpful. When responding to users, keep your messages clear and to the point.";
  const defaultPersonality = "Friendly and helpful";
  const defaultTraits = ["Helpful", "Friendly", "Knowledgeable"];
  const defaultBackstory = "";

  const steps = ["Discord Bot Setup", "Review & Create"];

  const handleNextStep = async () => {
    if (activeStep === 0) {
      // Validate Discord token before proceeding
      setLoading(true);
      setError(null);

      try {
        const result = await validateToken(discordToken);
        
        if (result.valid) {
          if (result.messageContentEnabled) {
            // Only proceed if both token is valid AND message content intent is enabled
            setTokenValidated(true);
            setApplicationId(result.botId || "");
            setValidationMessage("Token is valid and Message Content Intent is enabled!");
            setActiveStep(1);
          } else {
            // Token is valid but message content intent is not enabled
            setTokenValidated(false);
            setError("Message Content Intent is not enabled for this bot. Please enable it in the Discord Developer Portal and try again.");
            setValidationMessage(null);
          }
        } else {
          setTokenValidated(false);
          setError(
            result.error || "Invalid token. Please check and try again."
          );
          setValidationMessage(null);
        }
      } catch (err) {
        setTokenValidated(false);
        setError("Failed to validate token. Please try again.");
        setValidationMessage(null);
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Create the bot
      setLoading(true);
      setError(null);

      try {
        const bot = await createBot({
          name: botName,
          discordToken,
          applicationId,
          configuration: {
            systemPrompt: defaultSystemPrompt.replace("{{botName}}", botName),
            personality: defaultPersonality,
            traits: defaultTraits,
            backstory: defaultBackstory,
            llmProvider: LLMProvider.OPENAI, // Use the enum value instead of string literal
            llmModel: "gpt-3.5-turbo", // Default model
            apiKey: "", // Will be set later in settings
            knowledge: [], // No initial knowledge base
            imageGeneration: {
              enabled: false,
              provider: ImageProvider.OPENAI, // Use the enum value instead of string literal
            },
            toolsEnabled: false,
            tools: [],
          },
        });

        toast.success("Bot created successfully!");
        navigate(`/bots/${bot.id}`);
      } catch (err) {
        setError("Failed to create bot. Please try again.");
        setLoading(false);
      }
    }
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const isNextDisabled = () => {
    if (activeStep === 0) {
      return !botName || !discordToken || loading;
    }
    return loading;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Box
          sx={{
            display: "inline-flex",
            p: 2,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            mb: 2,
          }}
        >
          <BotIcon color="primary" sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
          Create a New Discord Bot
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect your Discord bot to Discura and customize its behavior
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          mb: 4,
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
            }}
          >
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Discord Bot Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your Discord bot details. You can create a bot in the{" "}
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.palette.primary.main }}
              >
                Discord Developer Portal
              </a>
              .
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}
            >
              <TextField
                fullWidth
                label="Bot Name"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="My Awesome Bot"
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.common.white, 0.9),
                    borderRadius: 1.5,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Discord Bot Token"
                value={discordToken}
                onChange={(e) => {
                  setDiscordToken(e.target.value);
                  setTokenValidated(false);
                  setValidationMessage(null);
                }}
                placeholder="Enter your Discord bot token"
                type="password"
                InputLabelProps={{ shrink: true }}
                helperText={
                  validationMessage ? (
                    <span style={{ color: theme.palette.success.main }}>
                      {validationMessage}
                    </span>
                  ) : (
                    "You can find this in the Discord Developer Portal under the Bot tab"
                  )
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.common.white, 0.9),
                    borderRadius: 1.5,
                  },
                }}
              />

              <Alert
                severity="info"
                sx={{
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                }}
              >
                <Typography variant="body2">
                  <strong>Important:</strong> Make sure your bot has the{" "}
                  <strong>Message Content Intent</strong> enabled in the Discord
                  Developer Portal. Without this, your bot won't be able to read
                  message content.
                </Typography>
              </Alert>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Bot Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review the details of your bot below. You'll be able to customize
              the personality, LLM settings, and more after creation.
            </Typography>

            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                mb: 3,
                borderColor: alpha(theme.palette.divider, 0.2),
              }}
            >
              <CardContent>
                <GridItem item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Bot Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {botName}
                  </Typography>
                </GridItem>

                <GridItem item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Application ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {applicationId}
                  </Typography>
                </GridItem>

                <GridItem item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Default Personality
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {defaultPersonality}
                  </Typography>
                </GridItem>

                <GridItem item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Default Traits
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {defaultTraits.map((trait) => (
                      <Box
                        key={trait}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          color: theme.palette.primary.main,
                          fontSize: "0.875rem",
                        }}
                      >
                        {trait}
                      </Box>
                    ))}
                  </Box>
                </GridItem>
              </CardContent>
            </Card>

            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              }}
            >
              Your bot is ready to be created! You'll be able to customize its
              personality, LLM settings, and more after creation.
            </Alert>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={
              activeStep === 0 ? () => navigate("/bots") : handlePrevStep
            }
            disabled={loading}
            sx={{
              px: 3,
              borderRadius: 1,
              borderWidth: 1.5,
              "&:hover": {
                borderWidth: 1.5,
              },
            }}
          >
            {activeStep === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            variant="contained"
            onClick={handleNextStep}
            disabled={isNextDisabled()}
            sx={{
              px: 3,
              borderRadius: 1,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : activeStep === steps.length - 1 ? (
              "Create Bot"
            ) : (
              "Next Step"
            )}
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          backgroundColor: alpha(theme.palette.info.main, 0.02),
          p: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          What happens next?
        </Typography>

        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            After creating your bot, you'll need to invite it to your Discord
            server
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            You can customize the bot's personality, LLM settings, and more from
            its detail page
          </Typography>
          <Typography component="li" variant="body2">
            Start your bot and begin interacting with it in your Discord server
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default BotCreate;
