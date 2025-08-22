import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, principal, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
    { label: "Products", path: "/products", icon: <InventoryIcon /> },
    { label: "Add Event", path: "/events/add", icon: <AddIcon /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null; // Don't show navigation if not authenticated
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background:
          "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* RouteSync Logo */}
          <Box
            onClick={() => navigate("/")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mr: 4,
              cursor: "pointer",
              flexShrink: 0, // Prevent logo from shrinking
              "&:hover": {
                transform: "scale(1.02)",
              },
              transition: "transform 0.2s ease",
            }}
          >
            {/* Logo Icon */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 15px rgba(0, 212, 255, 0.3)",
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
                    "linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)",
                  animation: "shimmer 2s infinite",
                },
              }}
            >
              <TimelineIcon sx={{ color: "white", fontSize: 24 }} />
            </Box>

            {/* Logo Text */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                RouteSync
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                }}
              >
                Blockchain Supply Chain
              </Typography>
            </Box>
          </Box>

          {/* Navigation Items - Centered */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              gap: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  backgroundColor:
                    location.pathname === item.path
                      ? "rgba(0, 212, 255, 0.15)"
                      : "transparent",
                  border:
                    location.pathname === item.path
                      ? "1px solid rgba(0, 212, 255, 0.3)"
                      : "1px solid transparent",
                  borderRadius: "12px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* User Info and Logout */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexShrink: 0, // Prevent user info from shrinking
            }}
          >
            <Chip
              icon={<AccountIcon />}
              label={principal ? `${principal.substring(0, 8)}...` : "User"}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                "& .MuiChip-icon": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "&:hover": {
                  borderColor: "rgba(0, 212, 255, 0.5)",
                  backgroundColor: "rgba(0, 212, 255, 0.1)",
                },
                transition: "all 0.2s ease",
              }}
            />
            <IconButton
              color="inherit"
              onClick={handleLogout}
              title="Logout"
              sx={{
                borderRadius: "10px",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Shimmer Animation Keyframes */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </AppBar>
  );
};

export default Navigation;
