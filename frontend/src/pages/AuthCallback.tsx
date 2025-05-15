import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * AuthCallback Component
 *
 * Handles the OAuth callback from Discord authentication.
 * Processes the token from URL params and sets up authentication state.
 */
const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [tokenProcessed, setTokenProcessed] = useState(false);

  // Process token from URL parameters
  useEffect(() => {
    const processToken = async () => {
      // Skip if we've already processed the token
      if (tokenProcessed) return;

      try {
        console.log(
          "[AuthCallback] Processing auth callback, path:",
          location.pathname,
        );
        console.log("[AuthCallback] Query string:", location.search);

        // Get token from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const error = params.get("error");

        console.log("[AuthCallback] Auth parameters:", {
          hasToken: !!token,
          error,
        });

        if (error) {
          console.error("[AuthCallback] Auth error from server:", error);
          setError(error);
          setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        if (!token) {
          console.error("[AuthCallback] No token received in callback URL");
          setError("No authentication token received");
          setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        console.log("[AuthCallback] Token found, calling login()...");
        await login(token);
        console.log("[AuthCallback] Login completed, auth state:", {
          isAuthenticated,
        });

        // Mark token as processed to prevent duplicate processing
        setTokenProcessed(true);
      } catch (err) {
        console.error("[AuthCallback] Processing error:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    };

    processToken();
  }, [location, login, navigate]);

  // Handle navigation after successful authentication
  useEffect(() => {
    // Only navigate if token was processed and authentication is successful
    if (tokenProcessed && isAuthenticated) {
      console.log(
        "[AuthCallback] Authentication successful, navigating to dashboard",
      );
      navigate("/dashboard", { replace: true });
    }
  }, [tokenProcessed, isAuthenticated, navigate]);

  // For debugging: log state changes
  useEffect(() => {
    console.log("[AuthCallback] State changed:", {
      isAuthenticated,
      tokenProcessed,
      isLoading,
    });
  }, [isAuthenticated, tokenProcessed, isLoading]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 4,
      }}
    >
      {error ? (
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      ) : (
        <>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {isLoading ? "Authenticating..." : "Redirecting to dashboard..."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we complete the authentication process
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthCallback;
