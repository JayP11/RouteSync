import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  OutlinedInput,
  InputLabel,
  FormControl,
  FormHelperText,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supplyChainService } from "../services/supplyChainService";
import { useAuth } from "../contexts/AuthContext";

const steps = [
  "Basic Information",
  "Ingredients & Certifications",
  "Review & Create",
];

const CreateProduct: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    manufacturer: "",
    batch_number: "",
    ingredients: [""],
    certifications: [""],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { principal } = useAuth();

  useEffect(() => {
    if (principal) {
      setFormData((prev) => ({ ...prev, manufacturer: principal }));
    }
  }, [principal]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleArrayChange = (
    field: "ingredients" | "certifications",
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: "ingredients" | "certifications") => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (
    field: "ingredients" | "certifications",
    index: number
  ) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, [field]: newArray }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = "Product name is required";
      if (!formData.description.trim())
        newErrors.description = "Description is required";
      if (!formData.manufacturer.trim())
        newErrors.manufacturer = "Manufacturer is required";
      if (!formData.batch_number.trim())
        newErrors.batch_number = "Batch number is required";
    }

    if (step === 1) {
      if (formData.ingredients.some((ing) => !ing.trim())) {
        newErrors.ingredients = "All ingredients must be filled";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setIsSubmitting(true);
    try {
      // Call the real ICP canister via supplyChainService
      const result = await supplyChainService.createProduct(
        formData.name,
        formData.description,
        formData.manufacturer,
        formData.batch_number,
        formData.ingredients.filter((ing) => ing.trim()), // Remove empty ingredients
        formData.certifications.filter((cert) => cert.trim()) // Remove empty certifications
      );

      console.log("Product created successfully:", result);
      setSuccessMessage(
        "Product created successfully! Redirecting to products page..."
      );
      setErrorMessage("");

      // Wait a moment to show success message, then navigate
      setTimeout(() => {
        navigate("/products");
      }, 2000);
    } catch (error) {
      console.error("Error creating product:", error);
      setErrorMessage("Failed to create product. Please try again.");
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manufacturer (Your Identity)"
                value={formData.manufacturer}
                onChange={(e) =>
                  handleInputChange("manufacturer", e.target.value)
                }
                error={!!errors.manufacturer}
                helperText={
                  principal
                    ? `Authenticated as: ${principal.substring(0, 20)}...`
                    : "Please login to continue"
                }
                required
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <BusinessIcon sx={{ mr: 1, color: "action.active" }} />
                  ),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Batch Number"
                value={formData.batch_number}
                onChange={(e) =>
                  handleInputChange("batch_number", e.target.value)
                }
                error={!!errors.batch_number}
                helperText={errors.batch_number}
                required
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Ingredients
              </Typography>
              {formData.ingredients.map((ingredient, index) => (
                <Box key={index} sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Ingredient ${index + 1}`}
                    value={ingredient}
                    onChange={(e) =>
                      handleArrayChange("ingredients", index, e.target.value)
                    }
                    error={!!errors.ingredients}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeArrayItem("ingredients", index)}
                    disabled={formData.ingredients.length === 1}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={() => addArrayItem("ingredients")}
                sx={{ mt: 1 }}
              >
                Add Ingredient
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Certifications
              </Typography>
              {formData.certifications.map((certification, index) => (
                <Box key={index} sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Certification ${index + 1}`}
                    value={certification}
                    onChange={(e) =>
                      handleArrayChange("certifications", index, e.target.value)
                    }
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeArrayItem("certifications", index)}
                    disabled={formData.certifications.length === 1}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={() => addArrayItem("certifications")}
                sx={{ mt: 1 }}
              >
                Add Certification
              </Button>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Product Information
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{formData.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Manufacturer
                  </Typography>
                  <Typography variant="body1">
                    {formData.manufacturer}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Batch Number
                  </Typography>
                  <Typography variant="body1">
                    {formData.batch_number}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {formData.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ingredients
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {formData.ingredients.map((ingredient, index) => (
                      <Chip key={index} label={ingredient} size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Certifications
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {formData.certifications.map((certification, index) => (
                      <Chip
                        key={index}
                        label={certification}
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/products")}
          sx={{ mr: 2 }}
        >
          Back to Products
        </Button>
        <Typography variant="h4">Create New Product</Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        {/* Success and Error Messages */}
        {successMessage && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "success.light",
              color: "success.contrastText",
              borderRadius: 1,
            }}
          >
            <Typography variant="body1">{successMessage}</Typography>
          </Box>
        )}
        {errorMessage && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "error.light",
              color: "error.contrastText",
              borderRadius: 1,
            }}
          >
            <Typography variant="body1">{errorMessage}</Typography>
          </Box>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                startIcon={<SaveIcon />}
              >
                {isSubmitting ? "Creating..." : "Create Product"}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateProduct;
