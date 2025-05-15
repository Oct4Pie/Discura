import { Box, Container, Paper, Typography, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.background.default,
        overflowX: "hidden",
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.primary.dark}11 100%)`,
        backgroundSize: "cover",
        position: "relative",
        overflow: "hidden",
        py: 3,
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.4,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            top: "5%",
            left: "10%",
            width: "20rem",
            height: "20rem",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.palette.primary.light}33 0%, transparent 70%)`,
          },
          "&:after": {
            content: '""',
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: "15rem",
            height: "15rem",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.palette.secondary.light}22 0%, transparent 70%)`,
          },
        }}
      />

      {/* Discord-style pattern background */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.5,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 2 2 2 2z' fill='%237289DA' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
          backgroundSize: "150px 150px",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="sm"
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          width: "100%",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2.5, sm: 3, md: 5 },
            width: "100%",
            maxWidth: "100%",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        >
          {/* Logo or brand icon could go here */}
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "20%",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              boxShadow: "0 4px 12px rgba(114, 137, 218, 0.2)",
              color: "white",
              fontSize: 36,
              fontWeight: "bold",
            }}
          >
            D
          </Box>

          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}
          >
            Discura
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            mb={4}
            align="center"
            sx={{ maxWidth: 320 }}
          >
            Create and manage Discord bots with AI capabilities
          </Typography>

          <Outlet />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 4, opacity: 0.7 }}
          >
            © {new Date().getFullYear()} Discura. All rights reserved.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
