import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Grid,
  alpha,
  useTheme,
  Skeleton,
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  SmartToy as BotIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useBotStore } from "../stores/botStore";
import GridItem from "../components/GridItem";
import BotStatusBadge from "../components/BotStatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import { FrontendBot } from "../types";
import { BotStatus } from "../api";

const BotList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { bots, isLoading, error, fetchBots, startBot, stopBot, deleteBot } = useBotStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentBotId, setCurrentBotId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, botId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setCurrentBotId(botId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentBotId(null);
  };

  const handleStartBot = async (botId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();

    try {
      await startBot(botId);
      toast.success("Bot started successfully");
    } catch (error) {
      console.error("Error starting bot:", error);
      toast.error("Failed to start bot");
    }
  };

  const handleStopBot = async (botId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();

    try {
      await stopBot(botId);
      toast.success("Bot stopped successfully");
    } catch (error) {
      console.error("Error stopping bot:", error);
      toast.error("Failed to stop bot");
    }
  };

  const handleDeleteClick = (botId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    setBotToDelete(botId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!botToDelete) return;

    try {
      await deleteBot(botToDelete);
      toast.success("Bot deleted successfully");
      setDeleteConfirmOpen(false);
      setBotToDelete(null);
    } catch (error) {
      console.error("Error deleting bot:", error);
      toast.error("Failed to delete bot");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setBotToDelete(null);
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      overflow: { xs: 'auto', md: 'hidden' },
      '&::-webkit-scrollbar': {
        width: 8,
        height: 8,
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderRadius: 2, // Custom border radius for scrollbar thumb
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'transparent',
      }
    }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Your Bots
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/bots/create")}
          sx={{ 
            fontWeight: 600,
            px: 2,
            py: 1,
            borderRadius: 1, // Custom border radius for button
          }}
        >
          Create Bot
        </Button>
      </Box>

      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        sx={{
          mx: { xs: -2, md: 0 },
          width: { xs: 'calc(100% + 32px)', md: '100%' },
          alignItems: 'stretch'
        }}
      >
        {isLoading ? (
          Array.from(new Array(3)).map((_, index) => (
            <GridItem xs={12} sm={6} md={4} key={`skeleton-${index}`} item>
              <Card sx={{ 
                height: "100%", 
                display: "flex", 
                flexDirection: "column",
                borderRadius: 2, // Custom border radius for card
              }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Skeleton variant="rectangular" width="60%" height={32} />
                    <Skeleton variant="rectangular" width="20%" height={32} />
                  </Box>
                  <Skeleton variant="rectangular" height={20} />
                  <Skeleton variant="rectangular" height={20} sx={{ mt: 1 }} />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width={100} height={36} />
                  <Skeleton variant="circular" width={36} height={36} sx={{ ml: "auto" }} />
                </CardActions>
              </Card>
            </GridItem>
          ))
        ) : error ? (
          <GridItem xs={12} item>
            <Card 
              sx={{ 
                p: 4,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: alpha(theme.palette.error.main, 0.2),
                backgroundColor: alpha(theme.palette.error.main, 0.02),
                boxShadow: 'none',
                borderRadius: 2, // Custom border radius for error card
              }}
            >
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => fetchBots()} 
                sx={{ 
                  mt: 2,
                  borderRadius: 1, // Custom border radius for button
                }}
              >
                Try Again
              </Button>
            </Card>
          </GridItem>
        ) : bots.length === 0 ? (
          <GridItem xs={12} item>
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
                borderRadius: 2, // Custom border radius for empty state card
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%', // Keep circular for this specific icon container
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
                startIcon={<AddIcon />}
                onClick={() => navigate("/bots/create")}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontWeight: 600,
                  borderRadius: 1, // Custom border radius for button
                }}
              >
                Create Your First Bot
              </Button>
            </Card>
          </GridItem>
        ) : (
          bots.map((bot: FrontendBot) => (
            <GridItem xs={12} sm={6} md={4} key={bot.id} item>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer',
                  borderRadius: 2, // Custom border radius for bot card
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                  },
                  '& .MuiCardMedia-root': {
                    height: { xs: 120, sm: 140 }
                  },
                  '& .MuiCardContent-root': {
                    flexGrow: 1,
                    p: { xs: 2, sm: 3 },
                    pb: '16px !important'
                  },
                  '& .MuiCardActions-root': {
                    p: { xs: 1.5, sm: 2 }
                  }
                }}
                onClick={() => navigate(`/bots/${bot.id}`)}
              >
                <Box 
                  sx={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <BotIcon 
                    sx={{ 
                      fontSize: 64, 
                      color: alpha(theme.palette.primary.main, 0.7),
                      opacity: 0.9
                    }} 
                  />
                  <Typography 
                    variant="h2" 
                    component="div" 
                    sx={{ 
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: alpha(theme.palette.primary.main, 0.15),
                      opacity: 0.6
                    }}
                  >
                    {bot.name.charAt(0).toUpperCase()}
                  </Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between", 
                      alignItems: "flex-start",
                      mb: 1.5,
                      flexWrap: "nowrap",
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        mr: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexGrow: 1
                      }}
                    >
                      {bot.name}
                    </Typography>
                    <Box sx={{ flexShrink: 0 }}>
                      <BotStatusBadge status={bot.status} />
                    </Box>
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
                    {bot.configuration?.personality || "No personality defined"}
                  </Typography>
                </CardContent>

                <Divider />

                <CardActions sx={{
                  justifyContent: 'flex-start',
                  gap: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  p: 2,
                  borderBottomLeftRadius: 2, // Match card border radius
                  borderBottomRightRadius: 2, // Match card border radius
                }}>
                  {bot.status === BotStatus.OFFLINE ? (
                    <Tooltip title="Start Bot">
                      <IconButton
                        color="secondary"
                        size="small"
                        aria-label="start bot"
                        onClick={(e) => handleStartBot(bot.id, e)}
                        sx={{
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          width: 36,
                          height: 36,
                          borderRadius: '8px', // Custom border radius for icon button
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.secondary.main, 0.2)
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
                        aria-label="stop bot"
                        onClick={(e) => handleStopBot(bot.id, e)}
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          width: 36,
                          height: 36,
                          borderRadius: '8px', // Custom border radius for icon button
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2)
                          }
                        }}
                      >
                        <StopIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Tooltip title="Delete Bot">
                    <IconButton
                      size="small"
                      aria-label="delete bot"
                      onClick={(e) => handleDeleteClick(bot.id, e)}
                      sx={{ 
                        color: "error.main",
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        width: 36,
                        height: 36,
                        borderRadius: '8px', // Custom border radius for icon button
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.2)
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <IconButton
                    size="small"
                    aria-label="bot options"
                    onClick={(e) => handleMenuClick(e, bot.id)}
                    sx={{ 
                      ml: "auto",
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      width: 36,
                      height: 36,
                      borderRadius: '8px', // Custom border radius for icon button
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </GridItem>
          ))
        )}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        elevation={2}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 1, // Custom border radius for menu
            minWidth: 180,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          }
        }}
      >
        <MenuItem
          onClick={() => {
            currentBotId && navigate(`/bots/${currentBotId}`);
            handleMenuClose();
          }}
          sx={{ py: 1.5 }}
        >
          Edit Configuration
        </MenuItem>
        <Divider />
        {currentBotId &&
        bots.find((b) => b.id === currentBotId)?.status === BotStatus.OFFLINE ? (
          <MenuItem
            onClick={() => currentBotId && handleStartBot(currentBotId)}
            sx={{ py: 1.5 }}
          >
            Start Bot
          </MenuItem>
        ) : (
          <MenuItem 
            onClick={() => currentBotId && handleStopBot(currentBotId)}
            sx={{ py: 1.5 }}
          >
            Stop Bot
          </MenuItem>
        )}
        <MenuItem
          onClick={() => currentBotId && handleDeleteClick(currentBotId)}
          sx={{ color: "error.main", py: 1.5 }}
        >
          Delete Bot
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Bot"
        message="Are you sure you want to delete this bot? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
};

export default BotList;
