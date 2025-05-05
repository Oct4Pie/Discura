import { Box, Container, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 700, color: 'primary.main' }}
          >
            Discura
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Create and manage Discord bots with AI capabilities
          </Typography>
          
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
