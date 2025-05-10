import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import { useBotStore } from '../stores/botStore';

const CreateBot = () => {
  const navigate = useNavigate();
  const { createBot, isLoading } = useBotStore();
  
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
      
      // Check if we have the bot ID and redirect to the bot detail page
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
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create a New Bot
      </Typography>
      
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Bot Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              error={!!nameError}
              helperText={nameError || 'Give your bot a name'}
              disabled={isLoading}
            />
            
            <TextField
              fullWidth
              label="Discord Bot Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              margin="normal"
              error={!!tokenError}
              helperText={tokenError || 'Enter the Discord token for your bot'}
              disabled={isLoading}
              type="password"
            />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/bots')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
              >
                {isLoading ? 'Creating Bot...' : 'Create Bot'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateBot;
