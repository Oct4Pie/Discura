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
  IconButton
} from '@mui/material';
import { 
  SmartToy as BotIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon
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
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
        }}
      >
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
        
        <Typography variant="h4" component="h1" fontWeight={600}>
          Create a New Bot
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 600 }}>
        {/* Info Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <BotIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Getting Started
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To create a new Discord bot, you'll need:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            <Typography variant="body2" component="li" color="text.secondary">
              A unique name for your bot
            </Typography>
            <Typography variant="body2" component="li" color="text.secondary">
              A Discord Bot Token from the Discord Developer Portal
            </Typography>
          </Box>
        </Paper>

        {/* Form Card */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Bot Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                error={!!nameError}
                helperText={nameError || 'Choose a descriptive name for your bot'}
                disabled={isLoading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <BotIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
              
              <Box sx={{ position: 'relative', mb: 3 }}>
                <TextField
                  fullWidth
                  label="Discord Bot Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  error={!!tokenError}
                  helperText={tokenError || 'Enter your Discord bot token'}
                  disabled={isLoading}
                  type="password"
                />
                <Tooltip title="You can find your bot token in the Discord Developer Portal" placement="top">
                  <IconButton 
                    size="small" 
                    sx={{ 
                      position: 'absolute',
                      right: -36,
                      top: 14,
                      color: 'text.disabled'
                    }}
                  >
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                gap: 2,
                mt: 4,
              }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/bots')}
                  disabled={isLoading}
                  sx={{
                    px: 3,
                    borderRadius: 2,
                    borderWidth: 1.5,
                    '&:hover': {
                      borderWidth: 1.5,
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
                    px: 4,
                    borderRadius: 2,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }
                  }}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Creating Bot...
                    </Box>
                  ) : (
                    'Create Bot'
                  )}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CreateBot;
