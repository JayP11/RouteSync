const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to execute dfx commands
function executeDfxCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}

// Test connection endpoint
app.get("/api/test-connection", async (req, res) => {
  try {
    const result = await executeDfxCommand(
      "dfx canister call supply_chain get_all_products"
    );
    res.json({
      success: true,
      result: "Connection successful",
      raw: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all products endpoint
app.get("/api/products", async (req, res) => {
  try {
    const result = await executeDfxCommand(
      "dfx canister call supply_chain get_all_products"
    );
    res.json({
      success: true,
      result: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create product endpoint
app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      description,
      manufacturer,
      batch_number,
      ingredients,
      certifications,
    } = req.body;

    // Format the command with proper escaping
    const ingredientsStr = ingredients.map((i) => `"${i}"`).join("; ");
    const certificationsStr = certifications.map((c) => `"${c}"`).join("; ");

    const command = `dfx canister call supply_chain create_product '("${name}", "${description}", "${manufacturer}", "${batch_number}", vec {${ingredientsStr}}, vec {${certificationsStr}})'`;

    const result = await executeDfxCommand(command);
    res.json({
      success: true,
      result: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add supply chain event endpoint
app.post("/api/events", async (req, res) => {
  try {
    console.log("Received event request:", JSON.stringify(req.body, null, 2));

    const {
      product_id,
      event_type,
      location,
      actor,
      details,
      coordinates,
      temperature,
      humidity,
    } = req.body;

    console.log("Parsed event data:", {
      product_id,
      event_type,
      location,
      actor,
      details,
      coordinates,
      temperature,
      humidity,
    });

    // Map event type string to enum value and format as Candid variant
    const eventTypeMap = {
      Production: "variant { Production }",
      "Quality Check": "variant { QualityCheck }",
      Packaging: "variant { Packaging }",
      Shipping: "variant { Shipping }",
      Customs: "variant { Customs }",
      Delivery: "variant { Delivery }",
      Retail: "variant { Retail }",
    };

    const eventType = eventTypeMap[event_type] || "variant { Production }";
    console.log("Mapped event type:", event_type, "->", eventType);

    // Build coordinates and optional parameters
    let coordsParam = "null";
    if (coordinates && coordinates.lat && coordinates.lng) {
      coordsParam = `opt record { ${coordinates.lat} : float64; ${coordinates.lng} : float64 }`;
    }

    let tempParam = temperature
      ? `opt ${parseFloat(temperature).toFixed(1)}`
      : "null";
    let humidityParam = humidity
      ? `opt ${parseFloat(humidity).toFixed(1)}`
      : "null";

    const command = `dfx canister call supply_chain add_supply_chain_event '("${product_id}", ${eventType}, "${location}", "${actor}", "${details}", ${coordsParam}, ${tempParam}, ${humidityParam})'`;

    console.log("Executing command:", command);

    const result = await executeDfxCommand(command);
    console.log("Command result:", result);

    // Check if the result contains an error
    if (result.includes("Error:") || result.includes("error:")) {
      console.error("Canister returned error:", result);
      res.status(400).json({
        success: false,
        error: result,
      });
      return;
    }

    // Note: Frontend service will clear its cache to ensure fresh data
    res.json({
      success: true,
      result: result,
    });
  } catch (error) {
    console.error("Error adding event:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all events endpoint
app.get("/api/events", async (req, res) => {
  try {
    // Get all products first
    const productsResult = await executeDfxCommand(
      "dfx canister call supply_chain get_all_products"
    );

    // Parse product IDs
    const productIds = parseProductIds(productsResult);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        result: [],
      });
    }

    // Process all traces in parallel for better performance
    const tracePromises = productIds.map(async (productId) => {
      try {
        const traceResult = await executeDfxCommand(
          `dfx canister call supply_chain get_supply_chain_trace '("${productId}")'`
        );

        if (
          traceResult &&
          !traceResult.includes("null") &&
          !traceResult.includes("opt null")
        ) {
          // Parse the trace to extract events
          const events = parseTraceEvents(traceResult, productId);
          return events;
        }
        return [];
      } catch (error) {
        console.warn(`Error getting trace for product ${productId}:`, error);
        return [];
      }
    });

    // Wait for all traces to complete in parallel
    const traceResults = await Promise.all(tracePromises);

    // Flatten all events into a single array
    const allEvents = traceResults.flat();

    res.json({
      success: true,
      result: allEvents,
    });
  } catch (error) {
    console.error("Error getting all events:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get events for a specific batch number endpoint
app.get("/api/events/:batchNumber", async (req, res) => {
  try {
    const { batchNumber } = req.params;
    console.log("Looking up events for batch number:", batchNumber);

    // First, get all products to find the one with this batch number
    const productsResult = await executeDfxCommand(
      `dfx canister call supply_chain get_all_products`
    );

    console.log("Products result:", productsResult);

    // Parse the products to find the one with matching batch number
    // This is a simple parsing approach - in production you'd use a proper Candid parser
    const productMatch = productsResult.match(
      new RegExp(`batch_number = "${batchNumber}"`)
    );

    if (!productMatch) {
      console.log("No product found with batch number:", batchNumber);
      res.json({
        success: true,
        result: "(null)",
      });
      return;
    }

    // Extract the product ID from the products result
    // Look for the product ID that comes before this batch number
    const productIdMatch = productsResult.match(
      new RegExp(`id = "([^"]+)"[^}]*batch_number = "${batchNumber}"`)
    );

    if (!productIdMatch) {
      console.log(
        "Could not extract product ID for batch number:",
        batchNumber
      );
      res.json({
        success: true,
        result: "(null)",
      });
      return;
    }

    const productId = productIdMatch[1];
    console.log(
      "Found product ID:",
      productId,
      "for batch number:",
      batchNumber
    );

    // Now get the trace using the product ID
    const traceResult = await executeDfxCommand(
      `dfx canister call supply_chain get_supply_chain_trace '("${productId}")'`
    );

    console.log("Trace result:", traceResult);

    res.json({
      success: true,
      result: traceResult,
    });
  } catch (error) {
    console.error("Error getting events:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend proxy server running on port ${PORT}`);
  console.log(
    `Canister interface: http://127.0.0.1:4943/?canisterId=lz3um-vp777-77777-aaaba-cai&id=lqy7q-dh777-77777-aaaaq-cai`
  );
});

// Helper function to parse product IDs from dfx output
function parseProductIds(dfxOutput) {
  try {
    // Simple regex to extract product IDs from the dfx output
    const idMatches = dfxOutput.match(/id = "([^"]+)"/g);
    if (idMatches) {
      return idMatches.map((match) => match.match(/id = "([^"]+)"/)[1]);
    }
    return [];
  } catch (error) {
    console.error("Error parsing product IDs:", error);
    return [];
  }
}

// Helper function to parse trace events from dfx output
function parseTraceEvents(dfxOutput, productId) {
  try {
    const events = [];

    // Check if events vector is empty
    if (dfxOutput.includes("events = vec {}")) {
      return []; // Return empty array for products with no events
    }

    // Look for event records in the trace
    // This regex looks for record blocks that contain event data
    const eventMatches = dfxOutput.match(/record \{([^}]+)\}/g);

    if (eventMatches) {
      eventMatches.forEach((match, index) => {
        // Only process if this looks like an actual event record
        if (match.includes("event_type") || match.includes("location")) {
          // Extract basic event info from the record
          const event = {
            id: `event-${productId}-${index}`,
            product_id: productId,
            event_type: extractEventType(match),
            location: extractLocation(match),
            timestamp: extractTimestamp(match),
            actor: extractActor(match),
            details: extractDetails(match),
            coordinates: undefined, // Will be extracted if available
            temperature: undefined, // Will be extracted if available
            humidity: undefined, // Will be extracted if available
          };

          // Extract additional fields if available
          if (match.includes("coordinates")) {
            event.coordinates = extractCoordinates(match);
          }
          if (match.includes("temperature")) {
            event.temperature = extractTemperature(match);
          }
          if (match.includes("humidity")) {
            event.humidity = extractHumidity(match);
          }

          // Only add valid events
          if (event.event_type && event.location) {
            events.push(event);
          }
        }
      });
    }

    return events;
  } catch (error) {
    console.error("Error parsing trace events:", error);
    return [];
  }
}

// Helper functions to extract specific fields from event records
function extractEventType(recordText) {
  // Look for event type variants
  if (recordText.includes("Production")) return "Production";
  if (recordText.includes("QualityCheck")) return "Quality Check";
  if (recordText.includes("Packaging")) return "Packaging";
  if (recordText.includes("Shipping")) return "Shipping";
  if (recordText.includes("Customs")) return "Customs";
  if (recordText.includes("Delivery")) return "Delivery";
  if (recordText.includes("Retail")) return "Retail";
  return "Unknown";
}

function extractLocation(recordText) {
  // Look for location field
  const locationMatch = recordText.match(/location = "([^"]+)"/);
  return locationMatch ? locationMatch[1] : "Unknown Location";
}

function extractTimestamp(recordText) {
  // Look for timestamp field
  const timestampMatch = recordText.match(/timestamp = (\d+)/);
  if (timestampMatch) {
    return parseInt(timestampMatch[1]);
  }
  return Date.now(); // Fallback to current time
}

function extractActor(recordText) {
  // Look for actor field
  const actorMatch = recordText.match(/actor = "([^"]+)"/);
  return actorMatch ? actorMatch[1] : "Unknown Actor";
}

function extractDetails(recordText) {
  // Look for details field
  const detailsMatch = recordText.match(/details = "([^"]+)"/);
  return detailsMatch ? detailsMatch[1] : "Event recorded";
}
