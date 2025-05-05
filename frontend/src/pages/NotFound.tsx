import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Typography variant="h1" sx={{ mb: 2, fontWeight: 700 }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
