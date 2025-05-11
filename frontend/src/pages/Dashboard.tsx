import { AddCircle as AddCircleIcon, SmartToy as BotIcon, PlayArrow as StartIcon, Stop as StopIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Divider,
    Grid,
    IconButton,
    Paper,
    Skeleton,
    Tooltip,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotStatus } from '../api';
import BotStatusBadge from '../components/BotStatusBadge';
import { useAuthStore } from '../stores/authStore';
import { useBotStore } from '../stores/botStore';
import GridItem from '../components/GridItem';
import { FrontendBot } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const { bots, isLoading, fetchBots, startBot, stopBot } = useBotStore();
  const { user } = useAuthStore();
  const theme = useTheme();
  
  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const totalBots = bots.length;
  const onlineBots = bots.filter(bot => bot.status === BotStatus.ONLINE).length;
  const offlineBots = bots.filter(bot => bot.status === BotStatus.OFFLINE).length;
  const errorBots = bots.filter(bot => bot.status === BotStatus.ERROR).length;

  const handleStartBot = async (botId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await startBot(botId);
    } catch (error) {
      console.error('Error starting bot:', error);
    }
  };

  const handleStopBot = async (botId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await stopBot(botId);
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      overflow: { xs: 'auto', md: 'hidden' },
      '&::-webkit-scrollbar': {
        width: 8,
        height: 8,
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderRadius: 4,
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'transparent',
      }
    }}>
      {/* Welcome Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: { xs: 3, md: 4 },
          borderRadius: { xs: 2, md: 3 },
          mx: { xs: -2, md: 0 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.dark, 0.85)})`,
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -20,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: alpha('#ffffff', 0.1),
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            right: 100,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: alpha('#ffffff', 0.05),
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Welcome, {user?.username || 'User'}!
              </Typography>
              
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2, maxWidth: 600 }}>
                Manage your Discord bots, check their status, and create new ones to enhance your server experience.
              </Typography>
            </Box>
            
            {/* Removed "Create New Bot" button from the welcome header */}
          </Box>
          
          {/* Stats Cards */}
          {!isLoading && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <GridItem item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha('#ffffff', 0.1),
                      backdropFilter: 'blur(5px)',
                      border: `1px solid ${alpha('#ffffff', 0.1)}`,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Total Bots</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {totalBots}
                    </Typography>
                  </Paper>
                </GridItem>
                
                <GridItem item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                      backdropFilter: 'blur(5px)',
                      border: `1px solid ${alpha('#ffffff', 0.1)}`,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Online</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {onlineBots}
                    </Typography>
                  </Paper>
                </GridItem>
                
                <GridItem item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha('#ffffff', 0.15),
                      backdropFilter: 'blur(5px)',
                      border: `1px solid ${alpha('#ffffff', 0.1)}`,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Offline</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {offlineBots}
                    </Typography>
                  </Paper>
                </GridItem>
                
                <GridItem item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.error.main, 0.15),
                      backdropFilter: 'blur(5px)',
                      border: `1px solid ${alpha('#ffffff', 0.1)}`,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Errors</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {errorBots}
                    </Typography>
                  </Paper>
                </GridItem>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Bots List */}
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        sx={{
          alignItems: 'stretch'
        }}
      >
        {isLoading ? (
          Array.from(new Array(3)).map((_, index) => (
            <GridItem item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="rectangular" height={30} width="60%" sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={20} width="40%" sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={16} width="90%" />
                </CardContent>
                <Box sx={{ mt: 'auto', p: 2, pt: 0 }}>
                  <Skeleton variant="rectangular" height={36} width="100%" />
                </Box>
              </Card>
            </GridItem>
          ))
        ) : bots.length > 0 ? (
          bots.map((bot: FrontendBot) => (
            <GridItem item xs={12} sm={6} md={4} key={bot.id}>
              <Card 
                onClick={() => navigate(`/bots/${bot.id}`)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  overflow: 'visible',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                  '& .MuiCardMedia-root': {
                    height: { xs: 120, sm: 140 }
                  },
                  '& .MuiCardContent-root': {
                    p: { xs: 2, sm: 3 },
                    pb: '16px !important'
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={`https://source.unsplash.com/random/600x200?${bot.name.replace(/\s+/g, "-").toLowerCase()}`}
                  alt={bot.name}
                />
                
                <CardContent sx={{ flexGrow: 1, pb: '16px !important' }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                      {bot.name}
                    </Typography>
                    <BotStatusBadge status={bot.status as BotStatus} />
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      lineHeight: 1.5,
                      height: 48,
                    }}
                  >
                    {bot.configuration?.personality || 'No personality set'}
                  </Typography>
                </CardContent>
                
                <Divider sx={{ opacity: 0.6 }} />
                
                <CardActions sx={{ 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.02)
                }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/bots/${bot.id}`);
                    }}
                    sx={{ 
                      fontWeight: 600,
                      px: 2,
                      borderRadius: 1.5,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      }
                    }}
                  >
                    Configure
                  </Button>
                  
                  {bot.status === BotStatus.OFFLINE ? (
                    <Tooltip title="Start Bot">
                      <IconButton 
                        color="secondary" 
                        size="small"
                        onClick={(e) => handleStartBot(bot.id, e)}
                        sx={{ 
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          width: 36,
                          height: 36,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                          }
                        }}
                      >
                        <StartIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Stop Bot">
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={(e) => handleStopBot(bot.id, e)}
                        sx={{ 
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          width: 36,
                          height: 36,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                          }
                        }}
                      >
                        <StopIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </GridItem>
          ))
        ) : (
          <GridItem item xs={12}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                px: 4,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                boxShadow: 'none',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    m: 'auto',
                    mb: 3,
                  }}
                >
                  <BotIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                </Box>
                
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  No Discord Bots Yet
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                  Create your first Discord bot to get started. You can customize its personality,
                  add integrations with AI models, and enhance your server experience.
                </Typography>
                
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<AddCircleIcon />}
                  onClick={() => navigate('/bots/create')}
                  sx={{
                    px: 4,
                    py: 1.2,
                    fontWeight: 600,
                  }}
                >
                  Create Your First Bot
                </Button>
              </CardContent>
            </Card>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
