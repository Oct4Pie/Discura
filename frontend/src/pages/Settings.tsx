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
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';
import GridItem from '../components/GridItem';
import { User } from '../types';

const Settings = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  // Cast user to the correct type
  const typedUser = user as User | null;
  
  // Get Discord avatar URL
  const avatarUrl = typedUser?.avatar 
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
                  alt={typedUser?.username}
                  sx={{ width: 80, height: 80, mr: 3 }}
                />
                <Box>
                  <Typography variant="h6">
                    {typedUser?.username}
                    {typedUser?.discriminator ? `#${typedUser.discriminator}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typedUser?.email}
                  </Typography>
                </Box>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Discord ID"
                    secondary={typedUser?.id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Account Created"
                    secondary={typedUser && new Date(typedUser.id).toLocaleDateString()}
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
