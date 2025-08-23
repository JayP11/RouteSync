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
      "dfx canister call supply_chain get_all_products --query"
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
      "dfx canister call supply_chain get_all_products --query"
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
    console.log("GET /api/events called");

    // Get all products first
    const productsResult = await executeDfxCommand(
      "dfx canister call supply_chain get_all_products --query"
    );
    console.log("Products result:", productsResult);

    // Parse product IDs
    const productIds = parseProductIds(productsResult);
    console.log("Parsed product IDs:", productIds);

    if (productIds.length === 0) {
      console.log("No product IDs found, returning empty result");
      return res.json({
        success: true,
        result: [],
      });
    }

    // Process all traces in parallel for better performance
    const tracePromises = productIds.map(async (productId) => {
      try {
        console.log(`Getting trace for product: ${productId}`);
        const traceResult = await executeDfxCommand(
          `dfx canister call supply_chain get_supply_chain_trace '("${productId}")' --query`
        );
        console.log(`Trace result for ${productId}:`, traceResult);

        if (
          traceResult &&
          !traceResult.includes("null") &&
          !traceResult.includes("opt null")
        ) {
          // Parse the trace to extract events
          const events = parseTraceEvents(traceResult, productId);
          console.log(`Parsed events for ${productId}:`, events);
          return events;
        }
        console.log(`No trace data for ${productId}`);
        return [];
      } catch (error) {
        console.warn(`Error getting trace for product ${productId}:`, error);
        return [];
      }
    });

    // Wait for all traces to complete in parallel
    const traceResults = await Promise.all(tracePromises);
    console.log("All trace results:", traceResults);

    // Flatten all events into a single array
    const allEvents = traceResults.flat();
    console.log("Final allEvents:", allEvents);

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
      `dfx canister call supply_chain get_all_products --query`
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
      `dfx canister call supply_chain get_supply_chain_trace '("${productId}")' --query`
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

    // Look for the events vector content - find the start and end properly
    const eventsStart = dfxOutput.indexOf("events = vec {");
    if (eventsStart === -1) {
      return [];
    }

    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let eventsEnd = eventsStart + "events = vec {".length;
    let inEvents = false;

    for (let i = eventsStart; i < dfxOutput.length; i++) {
      const char = dfxOutput[i];
      if (char === "{") {
        if (!inEvents) {
          inEvents = true;
        }
        braceCount++;
      }
      if (char === "}") {
        braceCount--;
        if (braceCount === 0 && inEvents) {
          eventsEnd = i;
          break;
        }
      }
    }

    const eventsContent = dfxOutput.substring(
      eventsStart + "events = vec {".length,
      eventsEnd
    );

    // Split by record boundaries - look for "record {" followed by content
    const recordBlocks = eventsContent.split("record {");
    let eventIndex = 0;

    // Process each record block
    recordBlocks.forEach((block, index) => {
      if (index === 0) return; // Skip the first split result

      // Find the closing brace for this record
      let braceCount = 0;
      let recordContent = "";
      let i = 0;

      while (i < block.length) {
        const char = block[i];
        if (char === "{") braceCount++;
        if (char === "}") {
          braceCount--;
          if (braceCount === 0) {
            recordContent = block.substring(0, i + 1);
            break;
          }
        }
        i++;
      }

      console.log("Processing record content:", recordContent);
      console.log(
        "Contains coordinates:",
        recordContent.includes("coordinates")
      );

      // Only process if this looks like an actual event record
      if (
        recordContent &&
        (recordContent.includes("event_type") ||
          recordContent.includes("location"))
      ) {
        // Extract basic event info from the record
        const event = {
          id: `event-${productId}-${eventIndex}`,
          product_id: productId,
          event_type: extractEventType(recordContent),
          location: extractLocation(recordContent),
          timestamp: extractTimestamp(recordContent),
          actor: extractActor(recordContent),
          details: extractDetails(recordContent),
          coordinates: undefined, // Will be extracted if available
          temperature: undefined, // Will be extracted if available
          humidity: undefined, // Will be extracted if available
        };

        // Extract additional fields if available
        if (recordContent.includes("coordinates")) {
          event.coordinates = extractCoordinates(recordContent);
        }
        if (recordContent.includes("temperature")) {
          event.temperature = extractTemperature(recordContent);
        }
        if (recordContent.includes("humidity")) {
          event.humidity = extractHumidity(recordContent);
        }

        console.log("Extracted event:", event);

        // Only add valid events
        if (event.event_type && event.location) {
          events.push(event);
          eventIndex++;
        }
      }
    });

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
  // Look for timestamp field - handle large numbers properly
  const timestampMatch = recordText.match(/timestamp = (\d+)/);
  if (timestampMatch) {
    // Convert from nanoseconds to milliseconds for JavaScript Date
    const timestampNs = BigInt(timestampMatch[1]);
    const timestampMs = Number(timestampNs / BigInt(1000000));
    // Ensure we don't get 0
    return timestampMs > 0 ? timestampMs : Date.now();
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

function extractCoordinates(recordText) {
  // Look for coordinates field - format: coordinates = opt record { lat : float64; lng : float64; }
  console.log("Extracting coordinates from:", recordText);

  const coordMatch = recordText.match(/coordinates = opt record \{([^}]+)\}/);
  if (coordMatch) {
    const coordContent = coordMatch[1];
    console.log("Coordinates content:", coordContent);
    // Extract all float numbers from the coordinates
    const numbers = coordContent.match(/(\d+\.\d+)/g);
    console.log("Extracted numbers:", numbers);
    if (numbers && numbers.length >= 2) {
      return {
        lat: parseFloat(numbers[0]),
        lng: parseFloat(numbers[1]),
      };
    }
  }

  return undefined;
}

function extractTemperature(recordText) {
  // Look for temperature field - format: temperature = opt (value : float64)
  const tempMatch = recordText.match(/temperature = opt \(([^)]+)\)/);
  if (tempMatch) {
    const tempValue = tempMatch[1].match(/(\d+\.\d+)/);
    return tempValue ? parseFloat(tempValue[1]) : undefined;
  }
  return undefined;
}

function extractHumidity(recordText) {
  // Look for humidity field - format: humidity = opt (value : float64)
  const humidityMatch = recordText.match(/humidity = opt \(([^)]+)\)/);
  if (humidityMatch) {
    const humidityValue = humidityMatch[1].match(/(\d+\.\d+)/);
    return humidityValue ? parseFloat(humidityValue[1]) : undefined;
  }
  return undefined;
}
