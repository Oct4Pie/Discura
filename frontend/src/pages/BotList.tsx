import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    SmartToy as BotIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Grid,
    IconButton,
    Paper,
    Tooltip,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BotStatus } from '../types';
import BotStatusBadge from '../components/BotStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import GridItem from '../components/GridItem';
import { useBotStore } from '../stores/botStore';
import { Bot } from '../types';

const BotList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { bots, isLoading, error, fetchBots, deleteBot, startBot, stopBot } = useBotStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  
  // Load bots on component mount
  useEffect(() => {
    fetchBots();
  }, [fetchBots]);
  
  // Handle bot deletion
  const handleDeleteClick = (botId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedBotId(botId);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedBotId) return;
    
    try {
      await deleteBot(selectedBotId);
      toast.success('Bot deleted successfully');
    } catch (error) {
      toast.error('Failed to delete bot');
      console.error('Delete bot error:', error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBotId(null);
    }
  };
  
  // Handle bot start/stop
  const handleStartBot = async (botId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await startBot(botId);
      toast.success('Bot started successfully');
    } catch (error) {
      toast.error('Failed to start bot');
      console.error('Start bot error:', error);
    }
  };
  
  const handleStopBot = async (botId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await stopBot(botId);
      toast.success('Bot stopped successfully');
    } catch (error) {
      toast.error('Failed to stop bot');
      console.error('Stop bot error:', error);
    }
  };
  
  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: 4, 
          borderRadius: 3,
          backgroundColor: 'background.paper',
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            My Bots
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your Discord bots powered by AI
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/bots/create')}
        >
          Create Bot
        </Button>
      </Paper>
      
      {isLoading ? (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center', 
          width: '100%', 
          borderRadius: 3, 
          bgcolor: 'background.paper' 
        }}>
          <Typography>Loading bots...</Typography>
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center', width: '100%', borderRadius: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button sx={{ mt: 2 }} variant="outlined" onClick={() => fetchBots()}>
            Try Again
          </Button>
        </Paper>
      ) : bots.length > 0 ? (
        <Grid container spacing={3}>
          {bots.map((bot: Bot) => (
            <GridItem xs={12} sm={6} md={4} key={bot.id} item>
              <Card sx={{ height: '100%' }}>
                <CardActionArea 
                  onClick={() => navigate(`/bots/${bot.id}`)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ 
                    flexGrow: 1,
                    display: 'flex', 
                    flexDirection: 'column',
                    p: 3
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      mb: 2
                    }}>
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          borderRadius: '50%',
                          p: 1,
                          mr: 2,
                          display: 'flex'
                        }}
                      >
                        <BotIcon />
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          component="div" 
                          noWrap
                          fontWeight={600}
                          sx={{ mb: 0.5 }}
                        >
                          {bot.name}
                        </Typography>
                        <BotStatusBadge status={bot.status as BotStatus} />
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {bot.configuration?.personality || 'No personality set'}
                    </Typography>
                    
                    <Box sx={{ 
                      mt: 'auto', 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      borderTop: 1,
                      borderColor: 'divider',
                      pt: 2
                    }}>
                      {bot.status === BotStatus.OFFLINE ? (
                        <Tooltip title="Start Bot">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={(e) => handleStartBot(bot.id, e)}
                          >
                            <StartIcon />
                          </IconButton>
                        </Tooltip>
                      ) : bot.status === BotStatus.ONLINE ? (
                        <Tooltip title="Stop Bot">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => handleStopBot(bot.id, e)}
                          >
                            <StopIcon />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      
                      <Tooltip title="Delete Bot">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => handleDeleteClick(bot.id, e)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </GridItem>
          ))}
        </Grid>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            width: '100%',
            borderRadius: 3,
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              borderRadius: '50%',
              p: 1.5,
              mb: 2,
              display: 'flex'
            }}
          >
            <BotIcon fontSize="large" />
          </Box>
          <Typography variant="h5" paragraph>
            No bots found
          </Typography>
          <Typography paragraph color="text.secondary">
            Create your first bot to get started with Discura
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/bots/create')}
            sx={{ mt: 1 }}
          >
            Create Bot
          </Button>
        </Paper>
      )}
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Bot"
        message="Are you sure you want to delete this bot? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
};

export default BotList;
