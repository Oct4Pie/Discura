import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    IconButton,
    Tooltip,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BotStatus } from '../types';
import BotStatusBadge from '../components/BotStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBotStore } from '../stores/botStore';
import GridItem from '../components/GridItem';
import { Bot } from '../types';

const BotList = () => {
  const navigate = useNavigate();
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Bots
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/bots/create')}
        >
          Create Bot
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
            <Typography>Loading bots...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
            <Typography color="error">{error}</Typography>
            <Button sx={{ mt: 2 }} onClick={() => fetchBots()}>
              Try Again
            </Button>
          </Box>
        ) : bots.length > 0 ? (
          bots.map((bot: Bot) => (
            <GridItem item xs={12} sm={6} md={4} key={bot.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/bots/${bot.id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="div" noWrap>
                        {bot.name}
                      </Typography>
                      
                      <BotStatusBadge status={bot.status as BotStatus} />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {bot.configuration?.personality || 'No personality set'}
                    </Typography>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </GridItem>
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
            <Typography paragraph>No bots found. Create your first bot to get started.</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/bots/create')}
            >
              Create Bot
            </Button>
          </Box>
        )}
      </Box>
      
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
