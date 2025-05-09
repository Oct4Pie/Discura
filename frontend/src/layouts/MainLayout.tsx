import {
    Add as AddIcon,
    SmartToy as BotIcon,
    Dashboard as DashboardIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon,
    AccountCircle
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Box,
    Container,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserResponseDto } from '@discura/common/types/api'; // Updated to use common package

// Width of the drawer
const drawerWidth = 240;

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  // Type assertion for user
  const typedUser = user as UserResponseDto | null;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  // Toggle drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle user menu open/close
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Handle logout
  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/login');
  };
  
  // Check if a route is active
  const isRouteActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  // Drawer content
  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
    }}>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 2
      }}>
        <Typography variant="h5" component="div" color="primary" fontWeight={700}>
          Discura
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => navigate('/')}
            selected={isRouteActive('/')}
            sx={{
              borderRadius: '0 24px 24px 0',
              mx: 1,
              my: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                }
              }
            }}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => navigate('/bots')}
            selected={isRouteActive('/bots') && !isRouteActive('/bots/create')}
            sx={{
              borderRadius: '0 24px 24px 0',
              mx: 1,
              my: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                }
              }
            }}
          >
            <ListItemIcon>
              <BotIcon />
            </ListItemIcon>
            <ListItemText primary="My Bots" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => navigate('/bots/create')}
            selected={isRouteActive('/bots/create')}
            sx={{
              borderRadius: '0 24px 24px 0',
              mx: 1,
              my: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                }
              }
            }}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Create Bot" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => navigate('/settings')}
            selected={isRouteActive('/settings')}
            sx={{
              borderRadius: '0 24px 24px 0',
              mx: 1,
              my: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                }
              }
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Render avatar and username - use user.id instead of discordId
  const userAvatar = typedUser?.avatar 
    ? `https://cdn.discordapp.com/avatars/${typedUser.id}/${typedUser.avatar}.png`
    : '/discord-avatar-placeholder.png';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Title - visible on mobile only */}
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            color="primary"
            fontWeight={700}
            sx={{ flexGrow: 1, display: { sm: 'none' } }}
          >
            Discura
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* User section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
              {typedUser?.username}
            </Typography>
            
            <Tooltip title="Account settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar 
                  alt={typedUser?.username || 'User'} 
                  src={userAvatar} 
                  sx={{ 
                    width: 38, 
                    height: 38,
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  {typedUser?.username ? typedUser.username.charAt(0).toUpperCase() : <AccountCircle />}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }}>
                <Typography textAlign="center">Settings</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer - Mobile (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            boxShadow: theme.shadows[5],
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer - Desktop (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            boxShadow: '4px 0 10px rgba(0, 0, 0, 0.05)',
            border: 'none',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Toolbar />
        <Container 
          maxWidth="lg" 
          sx={{ 
            pb: 6,
            height: '100%',
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
