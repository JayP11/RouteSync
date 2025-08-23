import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Thermostat as ThermostatIcon,
  Opacity as HumidityIcon,
  Verified as VerifiedIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { supplyChainService } from "../services/supplyChainService";

interface SupplyChainEvent {
  id: string;
  product_id: string;
  event_type: string;
  location: string;
  timestamp: string;
  actor: string;
  details: string;
  coordinates?: { lat: number; lng: number };
  temperature?: number;
  humidity?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  batch_number: string;
  production_date: string;
  ingredients: string[];
  certifications: string[];
}

const TraceProduct: React.FC = () => {
  const { batchNumber } = useParams<{ batchNumber: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [events, setEvents] = useState<SupplyChainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setIsLoading(true);

        // Load real product data from canister
        const canisterProducts = await supplyChainService.getAllProducts();
        console.log("Raw canister products received:", canisterProducts);
        const foundProduct = canisterProducts.find(
          (p) => p.batch_number === batchNumber
        );
        console.log("Found product:", foundProduct);

        if (foundProduct) {
          // Transform canister data to match our Product interface
          const realProduct: Product = {
            id: foundProduct.id || foundProduct.batch_number,
            name: foundProduct.name || "Unknown Product",
            description: foundProduct.description || "No description available",
            manufacturer: foundProduct.manufacturer || "Unknown Manufacturer",
            batch_number: foundProduct.batch_number || "No batch number",
            production_date: foundProduct.production_date
              ? new Date(foundProduct.production_date * 1000).toISOString()
              : new Date().toISOString(),
            ingredients: Array.isArray(foundProduct.ingredients)
              ? foundProduct.ingredients
              : [],
            certifications: Array.isArray(foundProduct.certifications)
              ? foundProduct.certifications
              : [],
          };

          console.log("Transformed product for frontend:", realProduct);
          console.log("Ingredients array:", realProduct.ingredients);
          console.log("Ingredients length:", realProduct.ingredients.length);
          setProduct(realProduct);

          // Fetch supply chain events from canister
          try {
            console.log(
              "Fetching events for batch:",
              foundProduct.batch_number
            );
            const events = await supplyChainService.getSupplyChainTrace(
              foundProduct.batch_number
            );
            console.log("Events received:", events);
            if (events && events.length > 0) {
              // Transform canister events to match our interface
              const realEvents: SupplyChainEvent[] = events.map(
                (event: any) => ({
                  id: event.id || "unknown",
                  product_id: event.product_id || foundProduct.batch_number,
                  event_type: event.event_type || "Unknown",
                  location: event.location || "Unknown",
                  timestamp: event.timestamp
                    ? new Date(event.timestamp * 1000).toISOString()
                    : new Date().toISOString(),
                  actor: event.actor || "Unknown",
                  details: event.details || "No details",
                  coordinates: event.coordinates || undefined,
                  temperature: event.temperature || undefined,
                  humidity: event.humidity || undefined,
                })
              );
              console.log("Transformed events:", realEvents);
              setEvents(realEvents);
            } else {
              console.log("No events found or empty array");
              setEvents([]);
            }
          } catch (error) {
            console.error("Error loading supply chain events:", error);
            setEvents([]);
          }
        } else {
          // Product not found
          setProduct(null);
          setEvents([]);
        }
      } catch (error) {
        console.error("Error loading product data:", error);
        setProduct(null);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (batchNumber) {
      loadProductData();
    }
  }, [batchNumber]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "Production":
        return <TimelineIcon />;
      case "Quality Check":
        return <VerifiedIcon />;
      case "Packaging":
        return <TimelineIcon />;
      case "Shipping":
        return <TimelineIcon />;
      case "Customs":
        return <TimelineIcon />;
      case "Delivery":
        return <TimelineIcon />;
      default:
        return <TimelineIcon />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "Production":
        return "success";
      case "QualityCheck":
        return "info";
      case "Packaging":
        return "warning";
      case "Shipping":
        return "primary";
      case "Customs":
        return "secondary";
      case "Delivery":
        return "success";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Typography>Loading product trace...</Typography>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Product not found
        </Typography>
        <Button onClick={() => navigate("/products")}>Back to Products</Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)",
        p: { xs: 2, sm: 3, md: 4 },
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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/products")}
          sx={{
            mb: 2,
            color: "#00d4ff",
            borderColor: "rgba(0, 212, 255, 0.3)",
            border: "1px solid",
            borderRadius: "12px",
            px: 3,
            py: 1,
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              borderColor: "#00d4ff",
            },
          }}
        >
          Back to Products
        </Button>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 700,
            fontSize: "3rem",
            mb: 1,
          }}
        >
          Supply Chain Trace
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: "rgba(255, 255, 255, 0.7)", opacity: 0.8 }}
        >
          Track the complete journey of your product through the supply chain
        </Typography>
      </Box>

      {/* Product Information */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          borderRadius: "20px",
          background: "rgba(26, 26, 46, 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
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
        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              Loading product information...
            </Typography>
          </Box>
        ) : !product ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" sx={{ color: "#ff6b6b" }} gutterBottom>
              Product Not Found
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              The product with batch number "{batchNumber}" could not be found.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {/* Product Details */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 700, color: "white" }}
                >
                  {product.name}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  paragraph
                  sx={{ mb: 3, color: "white" }}
                >
                  {product.description}
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <VerifiedIcon color="primary" />
                    <Typography
                      variant="body1"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      <strong>Manufacturer:</strong> {product.manufacturer}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <LocationIcon color="primary" />
                    <Typography
                      variant="body1"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      <strong>Batch Number:</strong> {product.batch_number}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TimelineIcon color="primary" />
                    <Typography
                      variant="body1"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      <strong>Production Date:</strong>{" "}
                      {product.production_date}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Certifications & Ingredients */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 600, mb: 2, color: "white" }}
                >
                  Certifications
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                  {product.certifications.map((cert, index) => (
                    <Chip
                      key={index}
                      label={cert}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Box>

                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 600, mb: 2, color: "white" }}
                >
                  Ingredients
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {product.ingredients.length > 0 ? (
                    product.ingredients.map((ingredient, index) => (
                      <Chip
                        key={index}
                        label={ingredient}
                        color="info"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No ingredients listed (Length:{" "}
                      {product.ingredients.length})
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Supply Chain Journey */}
      <Paper
        sx={{
          p: 4,
          mt: 3,
          borderRadius: "20px",
          background: "rgba(26, 26, 46, 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
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
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 700,
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "2rem",
          }}
        >
          Supply Chain Journey
        </Typography>

        {/* Timeline Container */}
        <Box sx={{ position: "relative" }}>
          {/* Central Timeline Line - Only show when there are events */}
          {!isLoading && events.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 6,
                background:
                  "linear-gradient(180deg, #00d4ff 0%, #7c3aed 50%, #f093fb 100%)",
                borderRadius: 3,
                transform: "translateX(-50%)",
                zIndex: 0,
                boxShadow: "0 4px 20px rgba(25, 118, 210, 0.3)",
              }}
            />
          )}

          {/* Loading state */}
          {isLoading && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography
                variant="h6"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Loading product data...
              </Typography>
            </Box>
          )}

          {/* Empty events state */}
          {!isLoading && events.length === 0 && (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                px: 4,
                borderRadius: "16px",
                background: "rgba(26, 26, 46, 0.8)",
                border: "2px dashed rgba(0, 212, 255, 0.5)",
                mx: 4,
              }}
            >
              <TimelineIcon
                sx={{ fontSize: "4rem", color: "#90caf9", mb: 2 }}
              />
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 600, color: "#00d4ff" }}
              >
                No Supply Chain Events Found
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 1, color: "rgba(255, 255, 255, 0.8)" }}
              >
                This product doesn't have any supply chain events recorded yet.
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.8, color: "rgba(255, 255, 255, 0.6)" }}
              >
                Events will appear here once they are added to the supply chain.
              </Typography>
            </Box>
          )}

          {/* Events timeline */}
          {!isLoading &&
            events.length > 0 &&
            events.map((event, index) => (
              <Box
                key={event.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 4,
                  position: "relative",
                  flexDirection: index % 2 === 0 ? "row" : "row-reverse",
                }}
              >
                {/* Event content - left side for even indices, right side for odd indices */}
                <Box
                  sx={{
                    width: "45%",
                    textAlign: index % 2 === 0 ? "right" : "left",
                    pr: index % 2 === 0 ? 3 : 0,
                    pl: index % 2 === 0 ? 0 : 3,
                  }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      p: 3,
                      display: "inline-block",
                      maxWidth: "100%",
                      borderRadius: "16px",
                      background: "rgba(26, 26, 46, 0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      position: "relative",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
                        borderColor: "rgba(255, 255, 255, 0.2)",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: `linear-gradient(90deg, ${getEventColor(
                          event.event_type
                        )}.main 0%, ${getEventColor(
                          event.event_type
                        )}.light 100%)`,
                      },
                    }}
                  >
                    {/* Event Header */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={event.event_type}
                        color={getEventColor(event.event_type)}
                        size="small"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      />
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          fontWeight: 600,
                          color: "white",
                          lineHeight: 1.2,
                        }}
                      >
                        {event.details}
                      </Typography>
                    </Box>

                    {/* Event Details Grid */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LocationIcon
                            fontSize="small"
                            sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: "rgba(255, 255, 255, 0.8)",
                            }}
                          >
                            {event.location}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <VerifiedIcon
                            fontSize="small"
                            sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: "rgba(255, 255, 255, 0.8)",
                            }}
                          >
                            {event.actor}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Environmental Data */}
                    {(event.temperature || event.humidity) && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          mb: 2,
                          justifyContent:
                            index % 2 === 0 ? "flex-end" : "flex-start",
                          flexDirection:
                            index % 2 === 0 ? "row-reverse" : "row",
                        }}
                      >
                        {event.temperature && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              p: 1.5,
                              borderRadius: "12px",
                              background: "rgba(255, 152, 0, 0.15)",
                              border: "1px solid rgba(255, 152, 0, 0.3)",
                              boxShadow: "0 4px 15px rgba(255, 152, 0, 0.1)",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 6px 20px rgba(255, 152, 0, 0.3)",
                              },
                            }}
                          >
                            <ThermostatIcon
                              fontSize="small"
                              sx={{ color: "#ff9800" }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "white" }}
                            >
                              {event.temperature}°C
                            </Typography>
                          </Box>
                        )}
                        {event.humidity && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              p: 1.5,
                              borderRadius: "12px",
                              background: "rgba(33, 150, 243, 0.15)",
                              border: "1px solid rgba(33, 150, 243, 0.3)",
                              boxShadow: "0 4px 15px rgba(33, 150, 243, 0.1)",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 6px 20px rgba(33, 150, 243, 0.3)",
                              },
                            }}
                          >
                            <HumidityIcon
                              fontSize="small"
                              sx={{ color: "#2196f3" }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "white" }}
                            >
                              {event.humidity}% RH
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* GPS Coordinates */}
                    {event.coordinates && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          p: 1.5,
                          borderRadius: "12px",
                          background: "rgba(76, 175, 80, 0.15)",
                          border: "1px solid rgba(76, 175, 80, 0.3)",
                          boxShadow: "0 4px 15px rgba(76, 175, 80, 0.1)",
                          justifyContent:
                            index % 2 === 0 ? "flex-end" : "flex-start",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(76, 175, 80, 0.3)",
                          },
                        }}
                      >
                        <LocationIcon
                          fontSize="small"
                          sx={{ color: "#4caf50" }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "white" }}
                        >
                          GPS: {event.coordinates.lat.toFixed(6)},{" "}
                          {event.coordinates.lng.toFixed(6)}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>

                {/* Center timeline line and dot */}
                <Box
                  sx={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${getEventColor(
                        event.event_type
                      )}.main, ${getEventColor(event.event_type)}.light)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: 4,
                      borderColor: "rgba(255, 255, 255, 0.9)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                      mb: 1,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.1)",
                        boxShadow: "0 6px 25px rgba(0, 0, 0, 0.5)",
                      },
                    }}
                  >
                    {getEventIcon(event.event_type)}
                  </Box>

                  {/* Timestamp */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                      background: "rgba(26, 26, 46, 0.9)",
                      px: 2,
                      py: 0.5,
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {format(new Date(event.timestamp), "MMM dd, yyyy HH:mm")}
                  </Typography>
                </Box>

                {/* Empty space for alternating layout */}
                <Box sx={{ width: "45%" }} />
              </Box>
            ))}
        </Box>
      </Paper>

      {/* Summary Statistics */}
      <Paper
        sx={{
          p: 4,
          mt: 3,
          borderRadius: "20px",
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
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
              "linear-gradient(90deg, #1976d2 0%, #42a5f5 50%, #90caf9 100%)",
          },
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 700,
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "2rem",
          }}
        >
          Journey Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                color: "white",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {events.length}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Total Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                background: "linear-gradient(135deg, #7c3aed 0%, #f093fb 100%)",
                color: "white",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {Math.round((events.length / 7) * 100)}%
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Journey Complete
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                background: "linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)",
                color: "white",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {events.filter((e) => e.coordinates).length}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  GPS Tracked
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TraceProduct;
