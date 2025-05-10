import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  ListItemAvatar,
  alpha,
  useTheme,
  IconButton,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  Person as PersonIcon, 
  AccountBox as AccountIcon,
  CalendarToday as CalendarIcon,
  Logout as LogoutIcon,
  Key as KeyIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';
import GridItem from '../components/GridItem';
import type { User } from '../types/user';

const Settings = () => {
  const { user, logout, fetchUserProfile } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!user) {
      fetchUserProfile().catch(error => {
        console.error('Failed to fetch user profile:', error);
      });
    }
  }, [user, fetchUserProfile]);
  
  const typedUser = user as User | null;
  
  const avatarUrl = typedUser?.id && typedUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${typedUser.id}/${typedUser.avatar}.png`
    : '/discord-avatar-placeholder.png';
  
  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    toast.info('You have been logged out');
    navigate('/login');
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
          onClick={() => navigate(-1)}
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
          Settings
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* User Profile */}
        <GridItem item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  User Profile
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                p: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                borderRadius: 2,
              }}>
                <Avatar
                  src={avatarUrl}
                  alt={typedUser?.username || 'User'}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mr: 3,
                    border: `3px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                  }}
                >
                  {(typedUser?.username && typedUser.username.charAt(0).toUpperCase()) || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {typedUser?.username || 'Anonymous User'}
                    {typedUser?.discriminator ? `#${typedUser.discriminator}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typedUser?.email || 'Email not available'}
                  </Typography>
                </Box>
              </Box>
              
              <List sx={{ mb: 3 }}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <AccountIcon sx={{ color: theme.palette.primary.main }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Discord ID"
                    secondary={typedUser?.id || 'Not available'}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <CalendarIcon sx={{ color: theme.palette.primary.main }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Account Created"
                    secondary={typedUser?.id ? new Date(parseInt(typedUser.id)).toLocaleDateString() : 'Not available'}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              </List>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={() => setLogoutDialogOpen(true)}
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  }
                }}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* App Settings */}
        <GridItem item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  App Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Typography variant="body2">
                  Coming soon: Customize the app appearance, notification settings, and more.
                </Typography>
              </Paper>
              
              <Button
                variant="contained"
                disabled
                startIcon={<SettingsIcon />}
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* API Keys */}
        <GridItem item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <KeyIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Default API Keys
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body2" paragraph>
                Set default API keys for your LLM providers and other services. 
                These will be used as defaults when creating new bots, but can be overridden for each bot.
              </Typography>
              
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Coming soon: Manage your OpenAI, Anthropic, and other API keys from this page.
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </GridItem>
      </Box>
      
      {/* Logout confirmation dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to log out of your account? You'll need to log in again to access your bots and settings.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button 
            onClick={() => setLogoutDialogOpen(false)}
            variant="outlined"
            sx={{
              borderWidth: 1.5,
              '&:hover': {
                borderWidth: 1.5,
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLogout} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
