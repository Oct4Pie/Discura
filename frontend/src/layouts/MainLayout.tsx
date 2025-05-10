import {
    Add as AddIcon,
    SmartToy as BotIcon,
    Dashboard as DashboardIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon,
    AccountCircle,
    NotificationsNoneOutlined as NotificationIcon,
    ChevronLeft,
    ChevronRight
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Badge,
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
    alpha,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserResponseDto } from '../api';

// Width of the drawer
const drawerWidth = 260;
const collapsedDrawerWidth = 80;

const MainLayout = () => {
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Type assertion for user
  const typedUser = user as UserResponseDto | null;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  // Toggle drawer collapsed state
  const handleDrawerCollapse = () => {
    setIsDrawerCollapsed(!isDrawerCollapsed);
  };

  // Toggle mobile drawer
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
      borderRight: '1px solid',
      borderColor: alpha(theme.palette.primary.main, 0.08),
      position: 'relative',
      overflow: 'hidden',
      transition: theme.transitions.create(['width', 'transform'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }}>
      {/* Collapse Button */}
      <IconButton
        onClick={handleDrawerCollapse}
        sx={{
          position: 'absolute',
          right: -10,
          top: 20,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          color: 'text.secondary',
          '&:hover': {
            background: theme.palette.background.paper,
          },
          zIndex: 1,
        }}
      >
        {isDrawerCollapsed ? <ChevronRight /> : <ChevronLeft />}
      </IconButton>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
        padding: isDrawerCollapsed ? 1 : 2,
        transition: theme.transitions.create(['padding', 'justify-content'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isDrawerCollapsed ? 0 : 1.5,
          }}
        >
          <Box
            sx={{
              width: isDrawerCollapsed ? 36 : 42,
              height: isDrawerCollapsed ? 36 : 42,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(114, 137, 218, 0.2)',
              color: 'white',
              fontSize: isDrawerCollapsed ? 20 : 24,
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            D
          </Box>
          
          {!isDrawerCollapsed && (
            <Typography variant="h5" component="div" color="primary" fontWeight={700}>
              Discura
            </Typography>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ opacity: 0.6 }} />
      
      <Box sx={{ 
        px: isDrawerCollapsed ? 1 : 2, 
        py: 2,
        transition: theme.transitions.create('padding', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}>
        {!isDrawerCollapsed && (
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, mb: 1, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Main
          </Typography>
        )}
        
        <List sx={{ p: 0 }}>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/')}
              selected={isRouteActive('/')}
              sx={{
                borderRadius: 2,
                py: 1.2,
                minHeight: 44,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  }
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: isDrawerCollapsed ? 0 : 40, justifyContent: 'center' }}>
                <DashboardIcon />
              </ListItemIcon>
              {!isDrawerCollapsed && <ListItemText primary="Dashboard" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      <Box sx={{ 
        px: isDrawerCollapsed ? 1 : 2, 
        py: 1,
        transition: theme.transitions.create('padding', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}>
        {!isDrawerCollapsed && (
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, mb: 1, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Bots
          </Typography>
        )}
        
        <List sx={{ p: 0 }}>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/bots')}
              selected={isRouteActive('/bots') && !isRouteActive('/bots/create')}
              sx={{
                borderRadius: 2,
                py: 1.2,
                minHeight: 44,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  }
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: isDrawerCollapsed ? 0 : 40, justifyContent: 'center' }}>
                <BotIcon />
              </ListItemIcon>
              {!isDrawerCollapsed && <ListItemText primary="My Bots" />}
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/bots/create')}
              selected={isRouteActive('/bots/create')}
              sx={{
                borderRadius: 2,
                py: 1.2,
                minHeight: 44,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  }
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: isDrawerCollapsed ? 0 : 40, justifyContent: 'center' }}>
                <AddIcon />
              </ListItemIcon>
              {!isDrawerCollapsed && <ListItemText primary="Create Bot" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      <Box sx={{ 
        px: isDrawerCollapsed ? 1 : 2, 
        py: 2,
        transition: theme.transitions.create('padding', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}>
        {!isDrawerCollapsed && (
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, mb: 1, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            System
          </Typography>
        )}
        
        <List sx={{ p: 0 }}>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/settings')}
              selected={isRouteActive('/settings')}
              sx={{
                borderRadius: 2,
                py: 1.2,
                minHeight: 44,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  }
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: isDrawerCollapsed ? 0 : 40, justifyContent: 'center' }}>
                <SettingsIcon />
              </ListItemIcon>
              {!isDrawerCollapsed && <ListItemText primary="Settings" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      {!isDrawerCollapsed && (
        <Box 
          sx={{ 
            mt: 'auto', 
            mx: 2, 
            mb: 2, 
            p: 2, 
            borderRadius: 2, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderLeft: `3px solid ${theme.palette.primary.main}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 80,
              height: 80,
              background: `linear-gradient(135deg, transparent 50%, ${alpha(theme.palette.primary.main, 0.06)} 50%)`,
              zIndex: 0
            }}
          />
          
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Need Help?
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7), display: 'block', mb: 1.5 }}>
            Check our documentation to get started with creating Discord bots
          </Typography>
          
          <Box
            component="a"
            href="https://docs.discura.io" 
            target="_blank"
            sx={{
              display: 'inline-block',
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.8125rem',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            View Docs →
          </Box>
        </Box>
      )}
    </Box>
  );

  // Render avatar and username
  const userAvatar = typedUser?.avatar 
    ? `https://cdn.discordapp.com/avatars/${typedUser.id}/${typedUser.avatar}.png`
    : '/discord-avatar-placeholder.png';

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        width: '100%'
      }}
    >
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { sm: `${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Toolbar 
          sx={{ 
            height: 70,
            display: 'flex',
            justifyContent: 'space-between',
            px: { xs: 1.5, sm: 2, md: 3 },
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { sm: 'none' } }}
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
              sx={{ display: { sm: 'none' } }}
            >
              Discura
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexShrink: 0
          }}>
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                size={isMobile ? "small" : "medium"}
              >
                <Badge badgeContent={2} color="error">
                  <NotificationIcon fontSize={isMobile ? "small" : "medium"} />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Create new bot">
              <IconButton 
                color="primary" 
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
                onClick={() => navigate('/bots/create')}
              >
                <AddIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>
            
            {/* User section */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: alpha(theme.palette.primary.main, 0.06),
                borderRadius: 2.5,
                padding: isTablet ? '4px' : '4px 8px 4px 12px',
                ml: 0.5,
                flexShrink: 0,
              }}
            >
              {!isTablet && (
                <Typography 
                  sx={{ 
                    mr: 2, 
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    maxWidth: 120,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {typedUser?.username}
                </Typography>
              )}
              
              <Tooltip title="Account settings">
                <IconButton 
                  onClick={handleOpenUserMenu} 
                  sx={{ p: isTablet ? 0.5 : 0 }}
                >
                  <Avatar 
                    alt={typedUser?.username || 'User'} 
                    src={userAvatar} 
                    sx={{ 
                      width: isTablet ? 32 : 38, 
                      height: isTablet ? 32 : 38,
                      border: `2px solid ${theme.palette.primary.main}`,
                    }}
                  >
                    {typedUser?.username ? typedUser.username.charAt(0).toUpperCase() : <AccountCircle />}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
            
            <Menu
              sx={{ 
                mt: '45px',
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                  minWidth: 180,
                }
              }}
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
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {typedUser?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Discord User
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }} sx={{ py: 1.5, borderRadius: 1, mx: 1, width: 'auto' }}>
                <SettingsIcon sx={{ mr: 2, fontSize: 18 }} />
                <Typography>Settings</Typography>
              </MenuItem>
              
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, borderRadius: 1, mx: 1, width: 'auto', color: 'error.main' }}>
                <Typography>Logout</Typography>
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
          zIndex: theme.zIndex.drawer,
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
            width: isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth,
            boxShadow: 'none',
            border: 'none',
            position: 'relative',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
          width: isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
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
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - ${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          position: 'relative',
          zIndex: 1,
          pt: '70px', // Match toolbar height
          ml: { xs: 0, sm: `${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container 
          maxWidth="xl" 
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
