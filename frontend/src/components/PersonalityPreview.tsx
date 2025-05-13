import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import { SmartToy as BotIcon, Send as SendIcon } from "@mui/icons-material";

interface PersonalityPreviewProps {
  botName: string;
  systemPrompt: string;
  personality: string;
  traits: string[];
  backstory: string;
}

/**
 * A component that shows a preview of how the bot's personality will be interpreted
 * and how it might respond to messages based on its configuration
 */
const PersonalityPreview = ({
  botName,
  systemPrompt,
  personality,
  traits,
  backstory,
}: PersonalityPreviewProps) => {
  const theme = useTheme();
  const [userMessage, setUserMessage] = useState("");
  const [conversation, setConversation] = useState<Array<{
    role: "user" | "bot";
    content: string;
  }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate a response based on the bot's personality
  const generateResponse = async () => {
    if (!userMessage.trim()) return;

    setIsGenerating(true);
    setConversation([...conversation, { role: "user", content: userMessage }]);

    // Simulate a delay to make it feel like the bot is thinking
    setTimeout(() => {
      // Generate a response based on personality, traits, and backstory
      const response = simulateBotResponse(userMessage);
      
      setConversation([
        ...conversation, 
        { role: "user", content: userMessage },
        { role: "bot", content: response }
      ]);
      setUserMessage("");
      setIsGenerating(false);
    }, 1500);
  };

  // Simulate a bot response based on personality configuration
  const simulateBotResponse = (message: string): string => {
    // This is a simplified simulation based on personality, traits, and backstory
    // In a real application, this would call an API to generate a response using an LLM
    
    // Default responses based on common message patterns
    if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
      return getGreeting();
    }
    
    if (message.toLowerCase().includes("who are you") || message.toLowerCase().includes("what are you")) {
      return getIdentityResponse();
    }
    
    if (message.toLowerCase().includes("help") || message.toLowerCase().includes("can you")) {
      return getHelpfulResponse();
    }
    
    // Default generic response
    return getGenericResponse();
  };
  
  // Generate responses that reflect the bot's personality
  
  const getGreeting = (): string => {
    const safeTraits = traits && traits.length > 0 ? traits : [];
    const greeting =
      `Hi there! I'm ${botName}${safeTraits.length > 0 ? ", and I'm " + (safeTraits[0]?.toLowerCase() || "") : ""}.`;
    const greetings = [
      `Hello! I'm ${botName}. ${personality ? `I'm ${personality.toLowerCase()}.` : ""}`,
      greeting,
      `Greetings! ${botName} at your service${backstory ? ". " + getBackstoryMention() : "!"}`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)] || "Hello!";
  };

  const getIdentityResponse = (): string => {
    let response = `I'm ${botName}`;
    if (personality) {
      response += `, a ${personality.toLowerCase()} bot`;
    }
    if (traits && traits.length > 0) {
      response += `. I would describe myself as ${traits.slice(0, 3).join(", ")}`;
    }
    if (backstory) {
      response += `. ${getBackstoryMention()}`;
    }
    return response;
  };

  const getHelpfulResponse = (): string => {
    const safeTraits = traits && traits.length > 0 ? traits : [];
    const helpResponses = [
      `I'd be ${personality ? personality.toLowerCase() + " and" : ""} happy to help with that!`,
      `As a ${safeTraits.length > 0 ? (safeTraits[Math.floor(Math.random() * safeTraits.length)]?.toLowerCase() || "helpful") : "helpful"} assistant, I can definitely assist with that.`,
      `I'm here to help! Let me know what you need.`
    ];
    return helpResponses[Math.floor(Math.random() * helpResponses.length)] || "I'm here to help!";
  };

  const getGenericResponse = (): string => {
    const safeTraits = traits && traits.length > 0 ? traits : [];
    const genericResponses = [
      `As a ${personality ? personality.toLowerCase() : "helpful"} bot, I'm here to assist you!`,
      `I'm ${botName}${safeTraits.length > 0 ? `, and I'm known for being ${safeTraits[Math.floor(Math.random() * safeTraits.length)]?.toLowerCase()}` : ""}.`,
      `I'm processing your request. ${getTraitMention()}`
    ];
    return genericResponses[Math.floor(Math.random() * genericResponses.length)] || "I'm here to assist you!";
  };

  const getBackstoryMention = (): string => {
    if (!backstory) return "";
    
    // Extract a relevant snippet from the backstory
    const sentences = backstory.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return "";
    
    return sentences[0] + ".";
  };
  
  const getTraitMention = (): string => {
    const safeTraits = traits && traits.length > 0 ? traits : [];
    if (safeTraits.length === 0) return "";
    const traitPhrases = [
      `As someone who's ${safeTraits[Math.floor(Math.random() * safeTraits.length)]?.toLowerCase() || "helpful"}, I'll do my best to help.`,
      `Being ${safeTraits[Math.floor(Math.random() * safeTraits.length)]?.toLowerCase() || "helpful"} is important to me.`,
      `I pride myself on being ${safeTraits[Math.floor(Math.random() * safeTraits.length)]?.toLowerCase() || "helpful"}.`
    ];
    return traitPhrases[Math.floor(Math.random() * traitPhrases.length)] || "";
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateResponse();
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* System prompt display */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          borderRadius: 2,
          mb: 3,
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
          System Prompt:
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {systemPrompt || "You are a helpful Discord bot assistant."}
        </Typography>
      </Paper>

      {/* Personality traits */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Bot Personality:
        </Typography>
        
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mr: 1, display: "inline" }}>
              Name:
            </Typography>
            <Typography variant="body2" sx={{ display: "inline" }}>
              {botName || "Unnamed Bot"}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mr: 1, display: "inline" }}>
              Personality:
            </Typography>
            <Typography variant="body2" sx={{ display: "inline" }}>
              {personality || "Not specified"}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mr: 1, display: "inline" }}>
              Traits:
            </Typography>
            <Box sx={{ display: "inline-flex", flexWrap: "wrap", gap: 0.5 }}>
              {traits.length > 0 ? (
                traits.map((trait, index) => (
                  <Chip
                    key={index}
                    label={trait}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                ))
              ) : (
                <Typography variant="body2" sx={{ display: "inline" }}>
                  None specified
                </Typography>
              )}
            </Box>
          </Box>

          {backstory && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>
                Backstory:
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {backstory}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Chat simulation */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Chat Simulation
      </Typography>
      
      <Card 
        elevation={0}
        sx={{ 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          mb: 2,
          maxHeight: "300px", 
          minHeight: "200px",
          overflowY: "auto" 
        }}
      >
        <CardContent>
          {conversation.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                p: 3,
              }}
            >
              <BotIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.primary, 0.2), mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Type a message to see how {botName || "your bot"} would respond
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {conversation.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: message.role === "user" ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.role === "user" ? "primary.main" : "secondary.main",
                      width: 32,
                      height: 32,
                    }}
                  >
                    {message.role === "user" ? "U" : "B"}
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      maxWidth: "80%",
                      backgroundColor:
                        message.role === "user"
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.secondary.main, 0.1),
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Message input */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          placeholder={`Send a message to ${botName || "your bot"}...`}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isGenerating}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={generateResponse}
          disabled={!userMessage.trim() || isGenerating}
          sx={{ borderRadius: 1.5 }}
        >
          {isGenerating ? "Thinking..." : "Send"}
        </Button>
      </Box>
    </Box>
  );
};

export default PersonalityPreview;