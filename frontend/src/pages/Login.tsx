import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  AccountTree as AccountTreeIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
      // Navigation will be handled by the auth context
      console.log("Login successful, redirecting to dashboard...");
    } catch (error) {
      console.error("Login failed:", error);
      // TODO: Add proper error handling with user notification
      alert("Login failed. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Floating particles effect */}
      <Box
        sx={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: "4px",
          height: "4px",
          background: "rgba(120, 219, 255, 0.6)",
          borderRadius: "50%",
          animation: "float1 6s ease-in-out infinite",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-20px",
            left: "-20px",
            width: "44px",
            height: "44px",
            background: "rgba(120, 219, 255, 0.1)",
            borderRadius: "50%",
          },
          "@keyframes float1": {
            "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
            "50%": { transform: "translateY(-20px) rotate(180deg)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "60%",
          right: "15%",
          width: "6px",
          height: "6px",
          background: "rgba(255, 119, 198, 0.6)",
          borderRadius: "50%",
          animation: "float2 8s ease-in-out infinite reverse",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-25px",
            left: "-25px",
            width: "56px",
            height: "56px",
            background: "rgba(255, 119, 198, 0.1)",
            borderRadius: "50%",
          },
          "@keyframes float2": {
            "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
            "50%": { transform: "translateY(-20px) rotate(180deg)" },
          },
        }}
      />

      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 6,
            borderRadius: "24px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
            position: "relative",
            overflow: "hidden",
            textAlign: "center", // Center all content
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background:
                "linear-gradient(90deg, #00d4ff 0%, #7c3aed 50%, #f093fb 100%)",
            },
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                mb: 3,
                boxShadow: "0 10px 30px rgba(0, 212, 255, 0.3)",
              }}
            >
              <AccountTreeIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>

            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
                letterSpacing: "-0.02em",
              }}
            >
              RouteSync
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                fontWeight: 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Blockchain-Based Supply Chain Transparency
            </Typography>
          </Box>

          {/* Feature Highlights */}
          <Box sx={{ mb: 6, display: "flex", justifyContent: "center" }}>
            <Grid container spacing={3} sx={{ maxWidth: "400px" }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "50px",
                      height: "50px",
                      borderRadius: "12px",
                      background: "rgba(0, 212, 255, 0.1)",
                      border: "1px solid rgba(0, 212, 255, 0.3)",
                      mb: 2,
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 24, color: "#00d4ff" }} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}
                  >
                    Secure
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "50px",
                      height: "50px",
                      borderRadius: "12px",
                      background: "rgba(124, 58, 237, 0.1)",
                      border: "1px solid rgba(124, 58, 237, 0.3)",
                      mb: 2,
                    }}
                  >
                    <VerifiedIcon sx={{ fontSize: 24, color: "#7c3aed" }} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}
                  >
                    Transparent
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "50px",
                      height: "50px",
                      borderRadius: "12px",
                      background: "rgba(240, 147, 251, 0.1)",
                      border: "1px solid rgba(240, 147, 251, 0.3)",
                      mb: 2,
                    }}
                  >
                    <TimelineIcon sx={{ fontSize: 24, color: "#7c3aed" }} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}
                  >
                    Verifiable
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Login Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SecurityIcon />
                )
              }
              sx={{
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                borderRadius: "16px",
                py: 2.5,
                px: 6,
                fontSize: "1.1rem",
                fontWeight: 600,
                boxShadow: "0 8px 32px rgba(0, 212, 255, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #00b8e6 0%, #6d28d9 100%)",
                  boxShadow: "0 12px 40px rgba(0, 212, 255, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
                minWidth: 250,
                height: "56px",
                mx: "auto", // Center horizontally
              }}
            >
              {isLoading
                ? "Connecting to Internet Identity..."
                : "Login with Internet Identity"}
            </Button>
          </Box>

          {/* Info Text */}
          <Typography
            variant="body2"
            sx={{
              mt: 4,
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.6)",
              fontWeight: 500,
            }}
          >
            Powered by Internet Computer (ICP) Blockchain
          </Typography>

          {/* Authentication Info */}
          <Typography
            variant="caption"
            sx={{
              mt: 3,
              display: "block",
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
              maxWidth: "400px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            {isLoading
              ? "Please complete the authentication in the popup window..."
              : "Click to authenticate with your Internet Identity and approve this application"}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
