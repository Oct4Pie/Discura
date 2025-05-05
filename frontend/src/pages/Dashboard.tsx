import { AddCircle as AddCircleIcon, SmartToy as BotIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Skeleton,
    Typography
} from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotStatus } from '@common/types';
import BotStatusBadge from '../components/BotStatusBadge';
import { useAuthStore } from '../stores/authStore';
import { useBotStore } from '../stores/botStore';
import GridItem from '../components/GridItem';
import { Bot } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const { bots, isLoading, fetchBots } = useBotStore();
  const { user } = useAuthStore();
  
  // Fetch bots on component mount
  useEffect(() => {
    fetchBots();
  }, [fetchBots]);
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.username || 'User'}!
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<AddCircleIcon />}
          onClick={() => navigate('/bots/create')}
        >
          Create Bot
        </Button>
      </Box>
      
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Your Discord Bots
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {isLoading ? (
          // Skeleton loaders
          Array.from(new Array(3)).map((_, index) => (
            <GridItem item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={30} width="60%" sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={20} width="40%" />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" height={36} width={100} />
                  </Box>
                </CardContent>
              </Card>
            </GridItem>
          ))
        ) : bots.length > 0 ? (
          // Bot cards
          bots.map((bot: Bot) => (
            <GridItem item xs={12} sm={6} md={4} key={bot.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/bots/${bot.id}`)}>
                  <CardContent>
                    <Typography variant="h6" component="div" noWrap>
                      {bot.name}
                    </Typography>
                    
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <BotStatusBadge status={bot.status as BotStatus} />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {bot.configuration?.personality || 'No personality set'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </GridItem>
          ))
        ) : (
          // No bots message
          <GridItem item xs={12}>
            <Card sx={{ textAlign: 'center', py: 4 }}>
              <CardContent>
                <BotIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Discord Bots Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first Discord bot to get started
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddCircleIcon />}
                  onClick={() => navigate('/bots/create')}
                >
                  Create Bot
                </Button>
              </CardContent>
            </Card>
          </GridItem>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
