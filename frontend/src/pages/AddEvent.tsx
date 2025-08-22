import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
  Thermostat as ThermostatIcon,
  Opacity as HumidityIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supplyChainService } from "../services/supplyChainService";
import { useAuth } from "../contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  manufacturer: string;
  batch_number: string;
}

interface EventFormData {
  product_id: string;
  event_type: string;
  location: string;
  actor: string;
  details: string;
  coordinates_lat: string;
  coordinates_lng: string;
  temperature: string;
  humidity: string;
}

const eventTypes = [
  "Production",
  "Quality Check",
  "Packaging",
  "Shipping",
  "Customs",
  "Delivery",
  "Retail",
];

const AddEvent: React.FC = () => {
  const navigate = useNavigate();
  const { principal } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    product_id: "",
    event_type: "",
    location: "",
    actor: principal || "Not authenticated",
    details: "",
    coordinates_lat: "",
    coordinates_lng: "",
    temperature: "",
    humidity: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Update actor when principal changes
  useEffect(() => {
    if (principal) {
      setFormData((prev) => ({
        ...prev,
        actor: principal,
      }));
    }
  }, [principal]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Load real products from canister
        const canisterProducts = await supplyChainService.getAllProducts();

        // Transform canister data to match our Product interface
        const transformedProducts: Product[] = canisterProducts.map(
          (product: any, index: number) => ({
            id: product.id || `product-${index}`, // Use the actual canister product ID
            name: product.name || "Unknown Product",
            manufacturer: product.manufacturer || "Unknown Manufacturer",
            batch_number: product.batch_number || "No batch number",
          })
        );

        setProducts(transformedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      setFormData((prev) => ({ ...prev, product_id: product.id }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) newErrors.product_id = "Product is required";
    if (!formData.event_type) newErrors.event_type = "Event type is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.actor) newErrors.actor = "Actor is required";
    if (!formData.details) newErrors.details = "Details are required";

    // Validate coordinates if provided
    if (formData.coordinates_lat && formData.coordinates_lng) {
      const lat = parseFloat(formData.coordinates_lat);
      const lng = parseFloat(formData.coordinates_lng);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.coordinates_lat =
          "Invalid latitude (must be between -90 and 90)";
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.coordinates_lng =
          "Invalid longitude (must be between -180 and 180)";
      }
    }

    // Validate temperature if provided
    if (formData.temperature) {
      const temp = parseFloat(formData.temperature);
      if (isNaN(temp) || temp < -50 || temp > 100) {
        newErrors.temperature =
          "Invalid temperature (must be between -50 and 100°C)";
      }
    }

    // Validate humidity if provided
    if (formData.humidity) {
      const hum = parseFloat(formData.humidity);
      if (isNaN(hum) || hum < 0 || hum > 100) {
        newErrors.humidity = "Invalid humidity (must be between 0 and 100%)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Call the real ICP canister via supplyChainService
      const coordinates =
        formData.coordinates_lat && formData.coordinates_lng
          ? {
              lat: parseFloat(formData.coordinates_lat),
              lng: parseFloat(formData.coordinates_lng),
            }
          : undefined;

      const temperature = formData.temperature
        ? parseFloat(formData.temperature)
        : undefined;

      const humidity = formData.humidity
        ? parseFloat(formData.humidity)
        : undefined;

      const result = await supplyChainService.addSupplyChainEvent(
        formData.product_id,
        formData.event_type,
        formData.location,
        formData.actor,
        formData.details,
        coordinates,
        temperature,
        humidity
      );

      console.log("Event added successfully:", result);
      setSuccess(true);

      setTimeout(() => {
        navigate("/products");
      }, 2000);
    } catch (error) {
      console.error("Error adding event:", error);
      setErrors({ general: "Failed to add event. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    console.log("getCurrentLocation called");

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      alert("Geolocation is not supported by this browser");
      return;
    }

    console.log("Requesting geolocation...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Geolocation success:", position);
        const { latitude, longitude } = position.coords;
        console.log(`Setting coordinates: lat=${latitude}, lng=${longitude}`);

        setFormData((prev) => ({
          ...prev,
          coordinates_lat: latitude.toString(),
          coordinates_lng: longitude.toString(),
        }));

        console.log("Coordinates set successfully");
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Failed to get location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

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
      {/* Header Section */}
      <Paper
        sx={{
          p: { xs: 3, sm: 4, md: 4 },
          mb: { xs: 3, sm: 4, md: 4 },
          borderRadius: { xs: "16px", sm: "20px" },
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
          <Grid item xs={12} md={8}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: { xs: 48, sm: 56, md: 64 },
                  height: { xs: 48, sm: 56, md: 64 },
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                  boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)",
                }}
              >
                <TimelineIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    background:
                      "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
                    lineHeight: 1.2,
                  }}
                >
                  Add Supply Chain Event
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                    fontWeight: 500,
                  }}
                >
                  Record a new event in the blockchain supply chain
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/products")}
              fullWidth
              sx={{
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: 600,
                borderRadius: "16px",
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.9rem", sm: "1rem" },
                textTransform: "none",
                "&:hover": {
                  borderColor: "#00d4ff",
                  backgroundColor: "rgba(0, 212, 255, 0.1)",
                  color: "#00d4ff",
                },
                transition: "all 0.3s ease",
              }}
            >
              Back to Products
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Success Message */}
      {success && (
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            mb: { xs: 3, sm: 4 },
            borderRadius: { xs: "16px", sm: "20px" },
            background: "rgba(34, 197, 94, 0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CheckCircleIcon sx={{ color: "#22c55e", fontSize: "2rem" }} />
            <Box>
              <Typography
                variant="h6"
                sx={{ color: "#22c55e", fontWeight: 700, mb: 1 }}
              >
                Event Added Successfully!
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "rgba(34, 197, 94, 0.8)" }}
              >
                Redirecting to products page in a few seconds...
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Error Display */}
      {errors.general && (
        <Alert
          severity="error"
          sx={{
            mb: { xs: 3, sm: 4 },
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            color: "#ff6b6b",
            borderRadius: "16px",
            "& .MuiAlert-icon": {
              color: "#ff6b6b",
            },
          }}
        >
          {errors.general}
        </Alert>
      )}

      {/* Main Form */}
      <Paper
        sx={{
          p: { xs: 3, sm: 4, md: 4 },
          borderRadius: { xs: "16px", sm: "20px" },
          background: "rgba(26, 26, 46, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "white",
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AddIcon sx={{ color: "#00d4ff" }} />
          Event Information
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Product Selection */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Select Product"
              value={formData.product_id}
              onChange={(e) => {
                const product = products.find((p) => p.id === e.target.value);
                handleProductSelect(product || null);
              }}
              required
              error={!!errors.product_id}
              helperText={
                errors.product_id || "Choose the product this event relates to"
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#00d4ff",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#00d4ff",
                    borderWidth: "2px",
                  },
                  "& input": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#00d4ff",
                  },
                },
                "& .MuiSelect-icon": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiFormHelperText-root": {
                  color: errors.product_id
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            >
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  <Box>
                    <Typography sx={{ color: "white", fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "0.8rem",
                      }}
                    >
                      Batch: {product.batch_number} | Manufacturer:{" "}
                      {product.manufacturer}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Event Type and Actor */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Event Type"
              value={formData.event_type}
              onChange={(e) => handleInputChange("event_type", e.target.value)}
              required
              error={!!errors.event_type}
              helperText={errors.event_type || "Type of event that occurred"}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#00d4ff",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#00d4ff",
                    borderWidth: "2px",
                  },
                  "& input": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#00d4ff",
                  },
                },
                "& .MuiSelect-icon": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiFormHelperText-root": {
                  color: errors.event_type
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            >
              {eventTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Actor */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Actor (Your Identity)"
              value={formData.actor}
              disabled
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: "#00d4ff" }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(0, 212, 255, 0.1)",
                  // border: "1px solid rgba(0, 212, 255, 0.3)",
                  color: "#00d4ff",
                  "& fieldset": {
                    border: "none",
                  },
                  "& input": {
                    color: "#00d4ff",
                  },
                  "& .MuiInputBase-input": {
                    color: "#00d4ff !important",
                    WebkitTextFillColor: "#00d4ff !important",
                    fontWeight: 500,
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#00d4ff",
                },
                "& .MuiFormHelperText-root": {
                  color: "rgba(0, 212, 255, 0.8)",
                },
              }}
              helperText={
                principal
                  ? `Authenticated as: ${principal.substring(0, 20)}...`
                  : "Please login to continue"
              }
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
              error={!!errors.location}
              helperText={errors.location || "Where this event occurred"}
              InputProps={{
                startAdornment: (
                  <LocationIcon sx={{ mr: 1, color: "#00d4ff" }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#00d4ff",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#00d4ff",
                    borderWidth: "2px",
                  },
                  "& input": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#00d4ff",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: errors.location
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            />
          </Grid>

          {/* Details */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Event Details"
              value={formData.details}
              onChange={(e) => handleInputChange("details", e.target.value)}
              required
              error={!!errors.details}
              helperText={
                errors.details || "Describe what happened during this event"
              }
              multiline
              rows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#00d4ff",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#00d4ff",
                    borderWidth: "2px",
                  },
                  "& textarea": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#00d4ff",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: errors.details
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            />
          </Grid>

          {/* Divider */}
          <Grid item xs={12}>
            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 2 }} />
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 600,
                mb: 2,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <LocationIcon sx={{ color: "#f093fb" }} />
              GPS Coordinates (Optional)
            </Typography>
          </Grid>

          {/* Coordinates */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Latitude"
              value={formData.coordinates_lat}
              onChange={(e) =>
                handleInputChange("coordinates_lat", e.target.value)
              }
              error={!!errors.coordinates_lat}
              helperText={errors.coordinates_lat || "e.g., 47.6062"}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#f093fb",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#f093fb",
                    borderWidth: "2px",
                  },
                  "& input": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#f093fb",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: errors.coordinates_lat
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Longitude"
              value={formData.coordinates_lng}
              onChange={(e) =>
                handleInputChange("coordinates_lng", e.target.value)
              }
              error={!!errors.coordinates_lng}
              helperText={errors.coordinates_lng || "e.g., -122.3321"}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#f093fb",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#f093fb",
                    borderWidth: "2px",
                  },
                  "& input": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#f093fb",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: errors.coordinates_lng
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            />
          </Grid>

          {/* Current Location Button */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={getCurrentLocation}
              startIcon={<LocationIcon />}
              sx={{
                borderColor: "#f093fb",
                color: "#f093fb",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#e879f9",
                  backgroundColor: "rgba(240, 147, 251, 0.1)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Use Current Location
            </Button>
          </Grid>

          {/* Divider */}
          <Grid item xs={12}>
            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 2 }} />
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 600,
                mb: 2,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <ThermostatIcon sx={{ color: "#00d4ff" }} />
              Environmental Conditions (Optional)
            </Typography>
          </Grid>

          {/* Environmental Conditions */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Temperature (°C)"
              value={formData.temperature}
              onChange={(e) => handleInputChange("temperature", e.target.value)}
              error={!!errors.temperature}
              helperText={
                errors.temperature || "Temperature at the time of the event"
              }
              InputProps={{
                startAdornment: (
                  <ThermostatIcon sx={{ mr: 1, color: "#00d4ff" }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#00d4ff",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#00d4ff",
                    borderWidth: "2px",
                  },
                  "& input": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#00d4ff",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: errors.temperature
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Humidity (%)"
              value={formData.humidity}
              onChange={(e) => handleInputChange("humidity", e.target.value)}
              error={!!errors.humidity}
              helperText={
                errors.humidity || "Relative humidity at the time of the event"
              }
              InputProps={{
                startAdornment: (
                  <HumidityIcon sx={{ mr: 1, color: "#00d4ff" }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "#00d4ff",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "#00d4ff",
                    borderWidth: "2px",
                  },
                  "& input": {
                    color: "white",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#00d4ff",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: errors.humidity
                    ? "#ff6b6b"
                    : "rgba(255, 255, 255, 0.6)",
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: { xs: 3, sm: 4 },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/products")}
            fullWidth={false}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.3)",
              color: "rgba(255, 255, 255, 0.8)",
              borderRadius: "12px",
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.5)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />
            }
            fullWidth={false}
            sx={{
              background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
              boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)",
              color: "white",
              fontWeight: 700,
              borderRadius: "12px",
              px: 4,
              py: 1.5,
              textTransform: "none",
              "&:hover": {
                background: "linear-gradient(135deg, #00b8e6 0%, #6d28d9 100%)",
                boxShadow: "0 12px 35px rgba(0, 212, 255, 0.4)",
                transform: "translateY(-2px)",
              },
              "&:disabled": {
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.3)",
                boxShadow: "none",
              },
              transition: "all 0.3s ease",
            }}
          >
            {isSubmitting ? "Adding Event..." : "Add Event"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddEvent;
