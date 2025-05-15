import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Discord as DiscordIcon } from "../components/icons/DiscordIcon";
import { useAuthStore } from "../stores/authStore";
import { API_ROUTES } from "@discura/common/types/routes";

const Login = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle Discord login
  const handleDiscordLogin = () => {
    setIsLoading(true);
    // Redirect to Discord OAuth using the proper API route from constants
    window.location.href = API_ROUTES.AUTH.DISCORD;
  };

  // Don't render anything if we're authenticated (prevents flash of login screen)
  if (isAuthenticated) {
    return null;
  }

  return (
    <Box
      sx={{
        width: "100%",
        textAlign: "center",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: { xs: 3, md: 4 },
          mx: { xs: -2, md: 0 }, // Compensate for container padding on mobile
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderRadius: { xs: 2, md: 3 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative corner accent */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 100,
            height: 100,
            background: `linear-gradient(135deg, transparent 70%, ${alpha(
              theme.palette.primary.main,
              0.1,
            )} 70%)`,
            zIndex: 0,
          }}
        />

        <Typography
          variant="body1"
          paragraph
          sx={{
            lineHeight: 1.6,
            position: "relative",
            zIndex: 1,
            fontWeight: 400,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            maxWidth: "600px",
            mx: "auto",
          }}
        >
          Create and manage Discord bots that work with LLM endpoints. Customize
          personalities, integrate AI features, and enhance your Discord server
          experience.
        </Typography>
      </Paper>

      <Button
        variant="contained"
        size="large"
        disabled={isLoading}
        startIcon={isLoading ? null : <DiscordIcon />}
        onClick={handleDiscordLogin}
        sx={{
          bgcolor: "#5865F2", // Discord's brand color
          "&:hover": {
            bgcolor: "#4752C4",
            transform: "translateY(-1px)",
            boxShadow: "0 6px 15px rgba(88, 101, 242, 0.35)",
          },
          "&.Mui-disabled": {
            bgcolor: alpha("#5865F2", 0.7),
            color: "white",
          },
          px: { xs: 3, sm: 4 },
          py: { xs: 1.2, sm: 1.5 },
          borderRadius: 2.5,
          fontSize: { xs: "0.9rem", sm: "1rem" },
          fontWeight: 600,
          textTransform: "none",
          minWidth: { xs: 200, sm: 240 },
          boxShadow: "0 4px 10px rgba(88, 101, 242, 0.25)",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
          "&::before": isLoading
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255, 255, 255, 0.1)",
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 0.5 },
                  "50%": { opacity: 0.2 },
                  "100%": { opacity: 0.5 },
                },
              }
            : {},
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CircularProgress
              size={20}
              thickness={4}
              sx={{
                color: "white",
                mr: 1.5,
              }}
            />
            Connecting...
          </Box>
        ) : (
          "Login with Discord"
        )}
      </Button>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          mt: { xs: 2, sm: 3 },
          opacity: 0.7,
          maxWidth: 280,
          mx: "auto",
          px: { xs: 2, sm: 0 },
          fontSize: { xs: "0.7rem", sm: "0.75rem" },
        }}
      >
        By logging in, you agree to our Terms of Service and Privacy Policy
      </Typography>
    </Box>
  );
};

export default Login;
