import { Box, Button, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Discord as DiscordIcon } from '../components/icons/DiscordIcon';
import { useAuthStore } from '../stores/authStore';
import { API_ROUTES } from 'common';

const Login = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Handle Discord login
  const handleDiscordLogin = () => {
    setIsLoading(true);
    // Redirect to Discord OAuth using the appropriate route constant
    window.location.href = API_ROUTES.AUTH.DISCORD;
  };
  
  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          backgroundColor: 'rgba(114, 137, 218, 0.05)',
          border: '1px solid rgba(114, 137, 218, 0.2)',
          borderRadius: 2
        }}
      >
        <Typography variant="body1" paragraph>
          Create and manage Discord bots that work with LLM endpoints. 
          Customize personalities, integrate AI features, and enhance your Discord server experience.
        </Typography>
      </Paper>
      
      <Button
        variant="contained"
        size="large"
        disabled={isLoading}
        startIcon={<DiscordIcon />}
        onClick={handleDiscordLogin}
        sx={{
          bgcolor: '#5865F2', // Discord's brand color
          '&:hover': {
            bgcolor: '#4752C4',
          },
          px: 3,
          py: 1.5,
          borderRadius: 2,
          fontSize: '1rem',
        }}
      >
        {isLoading ? 'Connecting...' : 'Login with Discord'}
      </Button>
    </Box>
  );
};

export default Login;
