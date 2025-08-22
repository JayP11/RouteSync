import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  AccountCircle as AccountIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supplyChainService } from "../services/supplyChainService";
import { format } from "date-fns";

interface DashboardStats {
  totalProducts: number;
  totalEvents: number;
  recentEvents: Array<{
    id: string;
    productName: string;
    eventType: string;
    timestamp: string;
    location: string;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { principal } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalEvents: 0,
    recentEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const supplyChain = await supplyChainService.getSupplyChain();
        setStats(supplyChain);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to fetch supply chain data.");
        // Set default values on error
        setStats({
          totalProducts: 0,
          totalEvents: 0,
          recentEvents: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    loading?: boolean;
  }> = ({ title, value, icon, loading = false }) => (
    <Card
      sx={{
        height: { xs: "100px", sm: "120px", md: "120px" }, // Responsive height
        borderRadius: { xs: "16px", sm: "20px" }, // Responsive border radius
        background: "rgba(26, 26, 46, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: { xs: "none", sm: "translateY(-4px)" }, // Disable hover on mobile
          boxShadow: {
            xs: "0 15px 35px rgba(0, 0, 0, 0.3)",
            sm: "0 20px 40px rgba(0, 0, 0, 0.4)",
          },
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 3 }, // Responsive padding
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: { xs: 1, sm: 2 }, // Responsive margin
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              color: "#00d4ff",
              mr: { xs: 1, sm: 2 }, // Responsive margin
              fontSize: { xs: "1.5rem", sm: "2rem" }, // Responsive icon size
            }}
          >
            {icon}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {loading && (
              <CircularProgress size={24} sx={{ mr: 1, color: "#00d4ff" }} />
            )}
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 800,
                color: "white",
                fontSize: { xs: "1.5rem", sm: "2.5rem", md: "3rem" }, // Responsive font size
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255, 255, 255, 0.8)",
            fontWeight: 500,
            textAlign: "center",
            fontSize: { xs: "0.8rem", sm: "1rem" }, // Responsive font size
          }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)",
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
        p: { xs: 2, sm: 3, md: 3 }, // Responsive padding
      }}
    >
      {/* User Info Section */}
      <Paper
        sx={{
          p: { xs: 3, sm: 4, md: 4 }, // Responsive padding
          mb: { xs: 3, sm: 4, md: 4 }, // Responsive margin
          borderRadius: { xs: "16px", sm: "20px" }, // Responsive border radius
          background: "rgba(26, 26, 46, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(90deg, #00d4ff 0%, #7c3aed 50%, #f093fb 100%)",
          },
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: { xs: 56, sm: 72, md: 72 }, // Responsive avatar size
                height: { xs: 56, sm: 72, md: 72 },
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)",
              }}
            >
              <AccountIcon sx={{ fontSize: { xs: 28, sm: 36, md: 36 } }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: "white",
                mb: { xs: 1, sm: 2 },
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" }, // Responsive font size
              }}
            >
              Welcome to RouteSync
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.8)",
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: "0.9rem", sm: "1.1rem" }, // Responsive font size
              }}
            >
              Blockchain-based supply chain transparency platform
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 2 }, // Responsive gap
                flexWrap: "wrap",
              }}
            >
              <Chip
                icon={<SecurityIcon />}
                label="Authenticated with Internet Identity"
                color="success"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  borderColor: "#00d4ff",
                  color: "#00d4ff",
                  fontSize: { xs: "0.7rem", sm: "0.8rem" }, // Responsive font size
                  "& .MuiChip-icon": { color: "#00d4ff" },
                }}
              />
              <Chip
                icon={<AccountIcon />}
                label={`Principal: ${
                  principal
                    ? principal.substring(
                        0,
                        { xs: 12, sm: 20 }[
                          window.innerWidth < 600 ? "xs" : "sm"
                        ]
                      ) + "..."
                    : "Unknown"
                }`}
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  borderColor: "#7c3aed",
                  color: "#7c3aed",
                  fontSize: { xs: "0.7rem", sm: "0.8rem" }, // Responsive font size
                  "& .MuiChip-icon": { color: "#7c3aed" },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Left side - Stat Cards */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={{ xs: 2, sm: 3 }} direction="column">
            <Grid item>
              <StatCard
                title="Total Products"
                value={loading ? 0 : stats.totalProducts}
                icon={<InventoryIcon />}
                loading={loading}
              />
            </Grid>
            <Grid item>
              <StatCard
                title="Total Events"
                value={loading ? 0 : stats.totalEvents}
                icon={<TimelineIcon />}
                loading={loading}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Right side - Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: { xs: 3, sm: 4 }, // Responsive padding
              height: "100%",
              borderRadius: { xs: "16px", sm: "20px" }, // Responsive border radius
              background: "rgba(26, 26, 46, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "white",
                mb: { xs: 2, sm: 3 }, // Responsive margin
                textAlign: "center",
                fontSize: { xs: "1.25rem", sm: "1.5rem" }, // Responsive font size
              }}
            >
              Quick Actions
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Button
                variant="contained"
                onClick={() => navigate("/products/create")}
                startIcon={<InventoryIcon />}
                sx={{
                  py: { xs: 1.5, sm: 2 }, // Responsive padding
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                  color: "white",
                  fontWeight: 600,
                  borderRadius: "12px",
                  textTransform: "none",
                  fontSize: { xs: "0.9rem", sm: "1rem" }, // Responsive font size
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #00b8e6 0%, #6d28d9 100%)",
                    transform: { xs: "none", sm: "translateY(-2px)" }, // Disable hover on mobile
                    boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Create New Product
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/events/add")}
                startIcon={<TimelineIcon />}
                sx={{
                  py: { xs: 1.5, sm: 2 }, // Responsive padding
                  borderColor: "#7c3aed",
                  color: "#7c3aed",
                  fontWeight: 600,
                  borderRadius: "12px",
                  textTransform: "none",
                  fontSize: { xs: "0.9rem", sm: "1rem" }, // Responsive font size
                  "&:hover": {
                    borderColor: "#6d28d9",
                    backgroundColor: "rgba(124, 58, 237, 0.1)",
                    transform: { xs: "none", sm: "translateY(-2px)" }, // Disable hover on mobile
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Add Supply Chain Event
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: { xs: 3, sm: 4 }, // Responsive padding
              borderRadius: { xs: "16px", sm: "20px" }, // Responsive border radius
              background: "rgba(26, 26, 46, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "white",
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: "1.25rem", sm: "1.5rem" }, // Responsive font size
              }}
            >
              Recent Supply Chain Events
              {stats.recentEvents.length > 0 && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    ml: { xs: 1, sm: 2 }, // Responsive margin
                    color: "rgba(255, 255, 255, 0.6)",
                    fontWeight: 400,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" }, // Responsive font size
                  }}
                >
                  ({stats.recentEvents.length} total)
                </Typography>
              )}
            </Typography>
            {stats.recentEvents.length > 5 && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.5)",
                  mb: { xs: 1.5, sm: 2 }, // Responsive margin
                  fontStyle: "italic",
                  fontSize: { xs: "0.7rem", sm: "0.75rem" }, // Responsive font size
                }}
              >
                Scroll to see more events
              </Typography>
            )}
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: { xs: 3, sm: 4 },
                }}
              >
                <CircularProgress size={40} sx={{ color: "#00d4ff" }} />
              </Box>
            ) : error ? (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                  border: "1px solid rgba(244, 67, 54, 0.3)",
                  color: "#ff6b6b",
                  fontSize: { xs: "0.8rem", sm: "0.875rem" }, // Responsive font size
                }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => window.location.reload()}
                    sx={{
                      color: "#ff6b6b",
                      borderColor: "#ff6b6b",
                      fontSize: { xs: "0.7rem", sm: "0.75rem" }, // Responsive font size
                      "&:hover": {
                        borderColor: "#ff5252",
                        backgroundColor: "rgba(244, 67, 54, 0.1)",
                      },
                    }}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            ) : stats.recentEvents.length > 0 ? (
              <Box
                sx={{
                  maxHeight: { xs: "250px", sm: "300px" }, // Responsive height
                  overflow: "auto",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background:
                      "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                    borderRadius: "4px",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #00b8e6 0%, #6d28d9 100%)",
                    },
                  },
                }}
              >
                <List sx={{ py: 0 }}>
                  {stats.recentEvents.map((event) => (
                    <ListItem
                      key={event.id}
                      divider
                      sx={{
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        py: { xs: 1, sm: 1.5 }, // Responsive padding
                      }}
                    >
                      <ListItemIcon>
                        <TimelineIcon
                          sx={{
                            color: "#00d4ff",
                            fontSize: { xs: "1.25rem", sm: "1.5rem" }, // Responsive icon size
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={event.productName}
                        secondary={`${event.eventType} at ${event.location}`}
                        primaryTypographyProps={{
                          sx: {
                            color: "white",
                            fontWeight: 600,
                            fontSize: { xs: "0.9rem", sm: "1rem" }, // Responsive font size
                          },
                        }}
                        secondaryTypographyProps={{
                          sx: {
                            color: "rgba(255, 255, 255, 0.7)",
                            fontSize: { xs: "0.8rem", sm: "0.875rem" }, // Responsive font size
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" }, // Responsive font size
                        }}
                      >
                        {format(
                          new Date(event.timestamp),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <TimelineIcon
                  sx={{
                    fontSize: 48,
                    color: "rgba(255, 255, 255, 0.4)",
                    mb: 2,
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{ color: "rgba(255, 255, 255, 0.8)", mb: 2 }}
                >
                  No supply chain events found
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 3 }}
                >
                  Events will appear here as they are added to the supply chain
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.5)",
                    display: "block",
                    mb: 3,
                  }}
                >
                  Current status: {stats.totalProducts} products created, 0
                  events recorded
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/events/add")}
                  sx={{
                    mt: 2,
                    borderColor: "#7c3aed",
                    color: "#7c3aed",
                    "&:hover": {
                      borderColor: "#6d28d9",
                      backgroundColor: "rgba(124, 58, 237, 0.1)",
                    },
                  }}
                >
                  Add First Event
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* System Status section removed as requested */}
      </Grid>
    </Box>
  );
};

export default Dashboard;
