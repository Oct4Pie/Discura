import {
    Add as AddIcon,
    SmartToy as BotIcon,
    Dashboard as DashboardIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon,
    AccountCircle,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon
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

const MainLayout = () => {
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
  const [collapsed, setCollapsed] = useState(false);
  const collapsedWidth = 72;

  // Toggle drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => setCollapsed(prev => !prev);

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
      width: collapsed ? collapsedWidth : drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflow: 'hidden',
    }}>
      {/* Collapse toggle */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        px: collapsed ? 0 : 2,
        minHeight: 64, // Standard Material UI AppBar height
      }}>
        {!collapsed && (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start', 
            gap: 1.5
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(114, 137, 218, 0.2)',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 'bold',
                }}
              >
                D
              </Box>
              
              <Typography variant="h5" component="div" color="primary" fontWeight={700}>
                Discura
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton 
          onClick={handleCollapseToggle} 
          size="small"
          sx={{
            width: 32,
            height: 32,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            }
          }}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>
      
      <Divider sx={{ opacity: 0.6 }} />
      
      <Box sx={{ px: collapsed ? 0 : 2, py: 2 }}>
        {!collapsed && (
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
                borderRadius: collapsed ? 0 : 2,
                py: 1.5,
                px: collapsed ? 0 : 2,
                minHeight: 50,
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 2 }}>
                <DashboardIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Dashboard" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      <Box sx={{ px: collapsed ? 0 : 2, py: 1 }}>
        {!collapsed && (
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
                borderRadius: collapsed ? 0 : 2,
                py: 1.5,
                px: collapsed ? 0 : 2,
                minHeight: 50,
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 2 }}>
                <BotIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="My Bots" />}
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/bots/create')}
              selected={isRouteActive('/bots/create')}
              sx={{
                borderRadius: collapsed ? 0 : 2,
                py: 1.5,
                px: collapsed ? 0 : 2,
                minHeight: 50,
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 2 }}>
                <AddIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Create Bot" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      <Divider sx={{ mt: 'auto', opacity: 0.6 }} />
      
      <Box sx={{ px: collapsed ? 0 : 2, py: 2 }}>
        {!collapsed && (
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
                borderRadius: collapsed ? 0 : 2,
                py: 1.5,
                px: collapsed ? 0 : 2,
                minHeight: 50,
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 2 }}>
                <SettingsIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Settings" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      {!collapsed && (
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
      {collapsed && (
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
          <Tooltip title="Need Help?">
            <IconButton
              component="a"
              href="https://docs.discura.io"
              target="_blank"
              size="small"
              color="primary"
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  // Render avatar and username - use user.id instead of discordId
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
          width: { sm: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)` },
          ml: { sm: `${collapsed ? collapsedWidth : drawerWidth}px` },
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: 64, // Standard Material UI AppBar height
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
          
          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexShrink: 0
          }}>
            {/* "Create new bot" button has been removed */}
            
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
            width: collapsed ? collapsedWidth : drawerWidth,
            boxShadow: 'none',
            border: 'none',
            position: 'relative',
          },
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          position: 'relative',
          zIndex: 1,
          ml: { xs: 0, sm: `${collapsed ? collapsedWidth : drawerWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Offset for AppBar */}
        <Toolbar sx={{ minHeight: 64 }} />
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
