import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const processAuth = async () => {
      try {
        // Get token from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');
        
        if (error) {
          setError(error);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!token) {
          setError('No authentication token received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Login with token
        await login(token);
        navigate('/');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    processAuth();
  }, [location, login, navigate]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {error ? (
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      ) : (
        <>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Authenticating...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthCallback;
