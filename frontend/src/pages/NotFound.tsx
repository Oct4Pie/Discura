import { Box, Button, Typography, alpha, useTheme } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          right: "15%",
          width: "20rem",
          height: "20rem",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "15%",
          left: "10%",
          width: "15rem",
          height: "15rem",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.light, 0.1)} 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          px: 3,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            mb: 2,
            fontWeight: 800,
            backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: { xs: "6rem", sm: "8rem" },
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: 4,
            maxWidth: 400,
            mx: "auto",
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or has been moved. Please
          check the URL or navigate back to the dashboard.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => navigate("/")}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 2.5,
            fontWeight: 600,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
            "&:hover": {
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default NotFound;
