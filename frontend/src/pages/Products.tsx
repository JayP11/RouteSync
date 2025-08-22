import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supplyChainService } from "../services/supplyChainService";

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

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load real products from the canister
      const canisterProducts = await supplyChainService.getAllProducts();

      // Ensure we have an array to work with
      if (!Array.isArray(canisterProducts)) {
        console.warn("Canister returned non-array data:", canisterProducts);
        setProducts([]);
        setFilteredProducts([]);
        return;
      }

      // Transform canister data to match our Product interface
      const transformedProducts: Product[] = canisterProducts.map(
        (product: any, index: number) => ({
          id: product?.id || `product-${index}`,
          name: product?.name || "Unknown Product",
          description: product?.description || "No description available",
          manufacturer: product?.manufacturer || "Unknown Manufacturer",
          batch_number: product?.batch_number || "No batch number",
          production_date: product?.production_date
            ? new Date(product.production_date * 1000).toISOString()
            : new Date().toISOString(),
          ingredients: Array.isArray(product?.ingredients)
            ? product.ingredients
            : [],
          certifications: Array.isArray(product?.certifications)
            ? product.certifications
            : [],
        })
      );

      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (err) {
      console.error("Error loading products:", err);
      setError(
        "Failed to load products from canister. Please check the connection and try again."
      );
      // Show empty state instead of mock data
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

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
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          spacing={{ xs: 2, sm: 3 }}
        >
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
                <InventoryIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
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
                  Products
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                    fontWeight: 500,
                  }}
                >
                  Manage and track all products in the supply chain
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/products/create")}
              size="large"
              fullWidth
              sx={{
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)",
                color: "white",
                fontWeight: 700,
                borderRadius: "16px",
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.9rem", sm: "1rem" },
                textTransform: "none",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #00b8e6 0%, #6d28d9 100%)",
                  boxShadow: "0 12px 35px rgba(0, 212, 255, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Add New Product
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Search and Filters */}
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          mb: { xs: 3, sm: 4 },
          borderRadius: { xs: "16px", sm: "20px" },
          background: "rgba(26, 26, 46, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
        }}
      >
        <TextField
          fullWidth
          placeholder="Search products by name, manufacturer, or batch number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#00d4ff", fontSize: "1.5rem" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
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
                "&::placeholder": {
                  color: "rgba(255, 255, 255, 0.5)",
                  opacity: 1,
                },
              },
            },
          }}
        />
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            color: "#ff6b6b",
            borderRadius: "16px",
            "& .MuiAlert-icon": {
              color: "#ff6b6b",
            },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Paper
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            borderRadius: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
          }}
        >
          <CircularProgress size={60} sx={{ color: "#00d4ff", mb: 2 }} />
          <Typography
            variant="h6"
            sx={{ color: "rgba(255, 255, 255, 0.8)", mb: 1 }}
          >
            Loading products from blockchain...
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            This may take a few seconds
          </Typography>
        </Paper>
      )}

      {/* Products Table */}
      {!isLoading && filteredProducts.length > 0 && (
        <Paper
          sx={{
            borderRadius: { xs: "16px", sm: "20px" },
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: "rgba(0, 212, 255, 0.1)",
                    borderBottom: "2px solid rgba(0, 212, 255, 0.2)",
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      color: "#00d4ff",
                      borderBottom: "none",
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    Product Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      color: "#00d4ff",
                      borderBottom: "none",
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    Manufacturer
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      color: "#00d4ff",
                      borderBottom: "none",
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    Batch Number
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      color: "#00d4ff",
                      borderBottom: "none",
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    Production Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      color: "#00d4ff",
                      borderBottom: "none",
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    Certifications
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      color: "#00d4ff",
                      borderBottom: "none",
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product, index) => {
                  return (
                    <TableRow
                      key={product.id}
                      hover
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(0, 212, 255, 0.02)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(0, 212, 255, 0.08)",
                          transform: { xs: "none", sm: "scale(1.01)" },
                          transition: "all 0.2s ease",
                        },
                        transition: "all 0.2s ease",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <TableCell
                        sx={{
                          py: { xs: 2, sm: 3 },
                          borderBottom: "none",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              color: "white",
                              fontSize: { xs: "0.9rem", sm: "1rem" },
                              mb: 0.5,
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255, 255, 255, 0.6)",
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                          >
                            {product.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 2, sm: 3 },
                          borderBottom: "none",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <BusinessIcon
                            sx={{ color: "#7c3aed", fontSize: "1rem" }}
                          />
                          <Typography
                            sx={{
                              color: "rgba(255, 255, 255, 0.8)",
                              fontSize: { xs: "0.8rem", sm: "0.875rem" },
                            }}
                          >
                            {product.manufacturer}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 2, sm: 3 },
                          borderBottom: "none",
                        }}
                      >
                        <Chip
                          label={product.batch_number}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#7c3aed",
                            color: "#7c3aed",
                            backgroundColor: "rgba(124, 58, 237, 0.1)",
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 2, sm: 3 },
                          borderBottom: "none",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CalendarIcon
                            sx={{ color: "#f093fb", fontSize: "1rem" }}
                          />
                          <Typography
                            sx={{
                              color: "rgba(255, 255, 255, 0.8)",
                              fontSize: { xs: "0.8rem", sm: "0.875rem" },
                            }}
                          >
                            {format(
                              new Date(product.production_date),
                              "MMM dd, yyyy"
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 2, sm: 3 },
                          borderBottom: "none",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          {product.certifications.length > 0 ? (
                            product.certifications.map((cert, index) => (
                              <Chip
                                key={index}
                                label={cert}
                                size="small"
                                icon={<VerifiedIcon />}
                                sx={{
                                  backgroundColor: "rgba(0, 212, 255, 0.1)",
                                  borderColor: "#00d4ff",
                                  color: "#00d4ff",
                                  fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                  "& .MuiChip-icon": {
                                    color: "#00d4ff",
                                  },
                                }}
                              />
                            ))
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "rgba(255, 255, 255, 0.4)",
                                fontStyle: "italic",
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              }}
                            >
                              No certifications
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 2, sm: 3 },
                          borderBottom: "none",
                        }}
                      >
                        <Button
                          variant="outlined"
                          startIcon={<TimelineIcon />}
                          onClick={() =>
                            navigate(`/trace/${product.batch_number}`)
                          }
                          size="small"
                          sx={{
                            borderColor: "#00d4ff",
                            color: "#00d4ff",
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            "&:hover": {
                              borderColor: "#00b8e6",
                              backgroundColor: "rgba(0, 212, 255, 0.1)",
                              transform: { xs: "none", sm: "translateY(-1px)" },
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          Trace
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <Paper
          sx={{
            p: { xs: 4, sm: 6, md: 8 },
            textAlign: "center",
            borderRadius: "20px",
            background: "rgba(26, 26, 46, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Avatar
            sx={{
              width: { xs: 64, sm: 80, md: 96 },
              height: { xs: 64, sm: 80, md: 96 },
              background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
              boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)",
              mx: "auto",
              mb: 3,
            }}
          >
            <InventoryIcon sx={{ fontSize: { xs: 32, sm: 40, md: 48 } }} />
          </Avatar>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "white",
              mb: 2,
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
            }}
          >
            {searchTerm ? "No products found" : "No products yet"}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
              maxWidth: "500px",
              margin: "0 auto",
              mb: 3,
            }}
          >
            {searchTerm
              ? "Try adjusting your search terms or check your spelling"
              : "Start building your supply chain by adding your first product"}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/products/create")}
              size="large"
              sx={{
                background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
                boxShadow: "0 8px 25px rgba(0, 212, 255, 0.3)",
                color: "white",
                fontWeight: 700,
                borderRadius: "16px",
                px: 4,
                py: 1.5,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                textTransform: "none",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #00b8e6 0%, #6d28d9 100%)",
                  boxShadow: "0 12px 35px rgba(0, 212, 255, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Create Your First Product
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default Products;
