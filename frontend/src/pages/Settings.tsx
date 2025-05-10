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
  ListItemAvatar
} from '@mui/material';
import { 
  Person as PersonIcon, 
  AccountBox as AccountIcon,
  CalendarToday as CalendarIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';
import GridItem from '../components/GridItem';
import type { User } from '../types/user';

const Settings = () => {
  const { user, logout, fetchUserProfile } = useAuthStore();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  useEffect(() => {
    // Fetch user profile if not already loaded
    if (!user) {
      fetchUserProfile().catch(error => {
        console.error('Failed to fetch user profile:', error);
      });
    }
  }, [user, fetchUserProfile]);
  
  // Cast to our frontend type with guaranteed id property
  const typedUser = user as User | null;
  
  // Generate avatar URL from Discord data if available
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
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {/* User Profile */}
        <GridItem item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Profile
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={avatarUrl}
                  alt={typedUser?.username || 'User'}
                  sx={{ width: 80, height: 80, mr: 3 }}
                >
                  {(typedUser?.username && typedUser.username.charAt(0).toUpperCase()) || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {typedUser?.username || 'Anonymous User'}
                    {typedUser?.discriminator ? `#${typedUser.discriminator}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typedUser?.email || 'Email not available'}
                  </Typography>
                </Box>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AccountIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Discord ID"
                    secondary={typedUser?.id || 'Not available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <CalendarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Account Created"
                    secondary={typedUser?.id ? new Date(parseInt(typedUser.id)).toLocaleDateString() : 'Not available'}
                  />
                </ListItem>
              </List>
              
              <Button
                variant="outlined"
                color="error"
                onClick={() => setLogoutDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* App Settings */}
        <GridItem item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                App Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Coming soon: Customize the app appearance, notification settings, and more.
              </Typography>
              
              <Button
                variant="contained"
                disabled
                sx={{ mt: 2 }}
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* API Keys */}
        <GridItem item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Default API Keys
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body2" paragraph>
                Set default API keys for your LLM providers and other services. 
                These will be used as defaults when creating new bots, but can be overridden for each bot.
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Coming soon: Manage your OpenAI, Anthropic, and other API keys from this page.
              </Typography>
            </CardContent>
          </Card>
        </GridItem>
      </Box>
      
      {/* Logout confirmation dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to log out of your account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
