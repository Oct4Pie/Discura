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
  CardActionArea,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
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
  const { bots, isLoading, error, fetchBots, startBot, stopBot, deleteBot } =
    useBotStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentBotId, setCurrentBotId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    botId: string
  ) => {
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

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading bots...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button variant="contained" onClick={() => fetchBots()} sx={{ mt: 2 }}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Your Bots
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/bots/create")}
        >
          Create Bot
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {bots.length === 0 ? (
          <Box sx={{ width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              You don't have any bots yet
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate("/bots/create")}
              sx={{ mt: 2 }}
            >
              Create Your First Bot
            </Button>
          </Box>
        ) : (
          bots.map((bot: FrontendBot) => (
            <GridItem xs={12} sm={6} md={4} key={bot.id} item>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/bots/${bot.id}`)}
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={`https://source.unsplash.com/random/300x140?${bot.name
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`}
                    alt={bot.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        gutterBottom
                        variant="h5"
                        component="h2"
                        sx={{ mb: 0 }}
                      >
                        {bot.name}
                      </Typography>
                      <BotStatusBadge status={bot.status} />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {bot.configuration?.personality
                        ? bot.configuration.personality.substring(0, 100) +
                          "..."
                        : "No personality defined"}
                    </Typography>
                  </CardContent>
                </CardActionArea>

                <Divider />

                <CardActions>
                  {bot.status === BotStatus.OFFLINE ? (
                    <Tooltip title="Start Bot">
                      <IconButton
                        color="primary"
                        aria-label="start bot"
                        onClick={(e) => handleStartBot(bot.id, e)}
                      >
                        <StartIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Stop Bot">
                      <IconButton
                        color="error"
                        aria-label="stop bot"
                        onClick={(e) => handleStopBot(bot.id, e)}
                      >
                        <StopIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  <IconButton
                    aria-label="bot options"
                    onClick={(e) => handleDeleteClick(bot.id, e)}
                    sx={{ color: "error.main" }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    aria-label="bot options"
                    onClick={(e) => handleMenuClick(e, bot.id)}
                    sx={{ ml: "auto" }}
                  >
                    <MoreIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </GridItem>
          ))
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => currentBotId && navigate(`/bots/${currentBotId}`)}
        >
          Edit Configuration
        </MenuItem>
        <Divider />
        {currentBotId &&
        bots.find((b) => b.id === currentBotId)?.status ===
          BotStatus.OFFLINE ? (
          <MenuItem
            onClick={() => currentBotId && handleStartBot(currentBotId)}
          >
            Start Bot
          </MenuItem>
        ) : (
          <MenuItem onClick={() => currentBotId && handleStopBot(currentBotId)}>
            Stop Bot
          </MenuItem>
        )}
        <MenuItem
          onClick={() => currentBotId && handleDeleteClick(currentBotId)}
          sx={{ color: "error.main" }}
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
