import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stepper
} from '@mui/material';
import { 
  SmartToy as BotIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  TokenOutlined as TokenIcon,
  Launch as LaunchIcon,
  CheckCircleOutline as CheckIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useBotStore } from '../stores/botStore';

const CreateBot = () => {
  const navigate = useNavigate();
  const { createBot, isLoading } = useBotStore();
  const theme = useTheme();
  
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [nameError, setNameError] = useState('');
  const [tokenError, setTokenError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Bot name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (!token.trim()) {
      setTokenError('Discord Token is required');
      isValid = false;
    } else {
      setTokenError('');
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const botData = {
        name: name.trim(),
        discordToken: token.trim()
      };
      
      const bot = await createBot(botData);
      
      toast.success('Bot created successfully!');
      
      if (bot?.id) {
        navigate(`/bots/${bot.id}`);
      } else {
        navigate('/bots');
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      toast.error('Failed to create bot. Please try again.');
    }
  };
  
  return (
    <Fade in={true} timeout={450}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header with back button and title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            mb: { xs: 4, md: 5 },
            mt: 1,
          }}
        >
          <IconButton
            onClick={() => navigate('/bots')}
            size="large"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.16),
                transform: 'translateX(-2px)'
              },
              transition: theme.transitions.create(['transform', 'background-color'], {
                duration: theme.transitions.duration.shorter
              }),
              color: theme.palette.primary.main,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.12)}`
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
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Create a New Bot
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Set up your Discord bot in just a few steps
            </Typography>
          </Box>
        </Box>

        {/* Main Card with Bot Details Form */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2, // Reduced border radius for better appearance
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.05)}`,
            transition: theme.transitions.create(['box-shadow']),
            '&:hover': {
              boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.08)}`,
            },
            mb: 4,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              height: 4, 
              width: '100%', 
              background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})` 
            }}
          />
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3.5, 
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Bot Details
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Bot Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                error={!!nameError}
                helperText={nameError || 'Choose a descriptive name for your bot'}
                disabled={isLoading}
                autoFocus
                sx={{ 
                  mb: 4,
                  '.MuiOutlinedInput-root': {
                    borderRadius: 1.5, // Slightly reduced border radius
                    transition: theme.transitions.create(['box-shadow']),
                    '&:hover, &.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                    }
                  }
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
                error={!!tokenError}
                helperText={tokenError || 'Enter your Discord bot token from the Developer Portal'}
                disabled={isLoading}
                type="password"
                sx={{ 
                  mb: 4,
                  '.MuiOutlinedInput-root': {
                    borderRadius: 1.5, // Slightly reduced border radius
                    transition: theme.transitions.create(['box-shadow']),
                    '&:hover, &.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                    }
                  }
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
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 3,
                mt: 5,
              }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/bots')}
                  disabled={isLoading}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 1, // Reduced border radius
                    borderWidth: 1,
                    fontWeight: 500,
                    '&:hover': {
                      borderWidth: 1,
                      backgroundColor: alpha(theme.palette.action.hover, 0.5)
                    }
                  }}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    px: 5,
                    py: 1.2,
                    borderRadius: 1, // Reduced border radius
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    fontWeight: 600,
                    transition: theme.transitions.create(['box-shadow', 'transform']),
                    '&:hover': {
                      boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <Typography variant="button" sx={{ fontWeight: 600 }}>Creating...</Typography>
                    </Box>
                  ) : (
                    'Create Bot'
                  )}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Discord Bot Setup Guide */}
        <Paper
          elevation={0}
          sx={{
            p: 3.5,
            backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.background.paper, 0.6)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            borderRadius: 2, // Reduced border radius
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.04)}`,
          }}
        >
          <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 2 }}>
            Discord Bot Setup Guide
          </Typography>
          
          <Stepper orientation="vertical" sx={{ mb: 2 }}>
            <Step active={true} completed={true}>
              <StepLabel 
                StepIconProps={{ 
                  icon: <CheckIcon color="primary" />,
                  sx: { color: theme.palette.primary.main } 
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>Create a Discord Application</Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Go to the Discord Developer Portal and create a new application.
                </Typography>
                <Button 
                  size="small" 
                  variant="text" 
                  href="https://discord.com/developers/applications" 
                  target="_blank"
                  startIcon={<LaunchIcon fontSize="small" />}
                  sx={{ 
                    mt: 1,
                    borderRadius: 1, // Reduced border radius
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
                  sx: { color: theme.palette.primary.main } 
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>Add a Bot to Your Application</Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  In your application dashboard, go to the "Bot" tab and click "Add Bot".
                </Typography>
              </Box>
            </Step>
            
            <Step active={true} completed={true}>
              <StepLabel 
                StepIconProps={{ 
                  icon: <CheckIcon color="primary" />,
                  sx: { color: theme.palette.primary.main } 
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>Enable Message Content Intent</Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  In the Bot settings, scroll down to "Privileged Gateway Intents" and enable "Message Content Intent".
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  This is required for your bot to read and respond to messages.
                </Typography>
              </Box>
            </Step>
            
            <Step active={true}>
              <StepLabel 
                StepIconProps={{ 
                  icon: <CheckIcon color="primary" />,
                  sx: { color: theme.palette.primary.main } 
                }}
                sx={{ py: 1 }}
              >
                <Typography fontWeight={500}>Copy Your Bot Token</Typography>
              </StepLabel>
              <Box sx={{ ml: 6, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  In the Bot settings, click "Reset Token" to generate a new token or "Copy" to copy your existing token.
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.warning.dark, mt: 1 }}>
                  Keep your token secret! Anyone with your token can control your bot.
                </Typography>
              </Box>
            </Step>
          </Stepper>
          
          <Divider sx={{ my: 2.5, opacity: 0.6 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: '50%', // Keep circular for icon container
              p: 0.8,
              mr: 2
            }}>
              <TokenIcon color="primary" fontSize="small" />
            </Box>
            <Typography variant="body2" color="text.primary">
              After completing these steps, paste your token above to connect your Discord bot.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Fade>
  );
};

export default CreateBot;
