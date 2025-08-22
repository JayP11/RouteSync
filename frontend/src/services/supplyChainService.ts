import { getCurrentConfig } from "../config/icp";

// Types
interface SupplyChainEvent {
  id: string;
  product_id: string;
  event_type: string;
  location: string;
  timestamp: number;
  actor: string;
  details: string;
  coordinates: any;
  temperature: any;
  humidity: any;
}

interface CanisterProduct {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  batch_number: string;
  production_date: number;
  ingredients: string[];
  certifications: string[];
}

// Service that communicates with the backend proxy to get real canister data
export const supplyChainService = {
  // Cache for storing results to avoid repeated API calls
  cache: {
    products: {
      data: null as CanisterProduct[] | null,
      timestamp: null as number | null,
    },
    events: {
      data: null as SupplyChainEvent[] | null,
      timestamp: null as number | null,
    },
    supplyChain: { data: null as any | null, timestamp: null as number | null },
  },

  // Cache duration in milliseconds (5 minutes)
  CACHE_DURATION: 5 * 60 * 1000,

  // Check if cache is valid
  isCacheValid(timestamp: number | null): boolean {
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  },

  // Clear cache
  clearCache(): void {
    this.cache.products = { data: null, timestamp: null };
    this.cache.events = { data: null, timestamp: null };
    this.cache.supplyChain = { data: null, timestamp: null };
  },

  // Test the connection by calling the backend proxy
  async testConnection(): Promise<string> {
    try {
      const config = getCurrentConfig();

      const response = await fetch("http://localhost:3002/api/test-connection");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return `Connection test successful - canister response: ${data.result}`;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      return (
        "Connection test failed - " +
        (error instanceof Error ? error.message : String(error))
      );
    }
  },

  // Create a new product by calling the backend proxy
  async createProduct(
    name: string,
    description: string,
    manufacturer: string,
    batch_number: string,
    ingredients: string[],
    certifications: string[]
  ): Promise<string> {
    try {
      const config = getCurrentConfig();

      const response = await fetch("http://localhost:3002/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          manufacturer,
          batch_number,
          ingredients,
          certifications,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Clear cache to ensure fresh data
        this.clearCache();
        return data.result;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      throw new Error("Failed to create product");
    }
  },

  // Get all products from the canister via backend proxy
  async getAllProducts(): Promise<CanisterProduct[]> {
    try {
      // Check cache first
      if (
        this.cache.products.data &&
        this.isCacheValid(this.cache.products.timestamp)
      ) {
        return this.cache.products.data;
      }

      const config = getCurrentConfig();

      const response = await fetch("http://localhost:3002/api/products");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.result) {
        // Parse the real products from the backend
        const products = this.parseDfxOutput(data.result);

        // Update cache
        this.cache.products.data = products;
        this.cache.products.timestamp = Date.now();

        return products;
      }

      return [];
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  },

  // Parse dfx output to extract actual product data
  parseDfxOutput(dfxOutput: string): any[] {
    try {
      console.log("Parsing dfx output:", dfxOutput);

      // Check if we have actual data from canister
      if (dfxOutput.includes("vec {")) {
        // Check if it's an empty vector
        if (dfxOutput.trim() === "(vec {})") {
          console.log("Canister returned empty product list");
          return [];
        }

        // Parse the actual Candid data structure
        console.log("Parsing actual canister data...");

        // Extract products from the Candid structure
        // Format: (vec { record { id = "1755781994917_1000"; name = "Coffee"; description = "..." } })
        const products: any[] = [];

        // Use balanced brace parsing to extract complete records
        let currentPos = 0;
        let recordIndex = 0;

        while (currentPos < dfxOutput.length) {
          const recordStart = dfxOutput.indexOf("record {", currentPos);
          if (recordStart === -1) break;

          // Find the complete record by counting braces
          let braceCount = 1;
          let recordEnd = recordStart + "record {".length;

          for (let i = recordEnd; i < dfxOutput.length; i++) {
            if (dfxOutput[i] === "{") braceCount++;
            if (dfxOutput[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                recordEnd = i + 1;
                break;
              }
            }
          }

          if (recordEnd > recordStart) {
            const completeRecord = dfxOutput.substring(recordStart, recordEnd);
            console.log(`\n--- Parsing record ${recordIndex + 1} ---`);
            console.log("Complete record being parsed:", completeRecord);

            try {
              // Extract individual fields with more robust regex
              const idMatch = completeRecord.match(/id\s*=\s*"([^"]+)"/);
              const nameMatch = completeRecord.match(/name\s*=\s*"([^"]+)"/);
              const descriptionMatch = completeRecord.match(
                /description\s*=\s*"([^"]+)"/
              );
              const manufacturerMatch = completeRecord.match(
                /manufacturer\s*=\s*"([^"]+)"/
              );
              const batchNumberMatch = completeRecord.match(
                /batch_number\s*=\s*"([^"]+)"/
              );

              // Use a more sophisticated approach for ingredients and certifications
              // Find the start of ingredients vector and count braces to find the end
              const ingredientsStart = completeRecord.indexOf(
                "ingredients = vec {"
              );
              let ingredients: string[] = [];
              if (ingredientsStart !== -1) {
                const startPos =
                  ingredientsStart + "ingredients = vec {".length;
                let braceCount = 1;
                let endPos = startPos;

                for (let i = startPos; i < completeRecord.length; i++) {
                  if (completeRecord[i] === "{") braceCount++;
                  if (completeRecord[i] === "}") {
                    braceCount--;
                    if (braceCount === 0) {
                      endPos = i;
                      break;
                    }
                  }
                }

                if (endPos > startPos) {
                  const ingredientsStr = completeRecord.substring(
                    startPos,
                    endPos
                  );
                  console.log(
                    "Raw ingredients string (brace counting):",
                    ingredientsStr
                  );
                  ingredients = ingredientsStr
                    .split(";")
                    .map((s: string) => s.trim().replace(/"/g, ""))
                    .filter((s: string) => s.length > 0);
                  console.log(
                    "Parsed ingredients (brace counting):",
                    ingredients
                  );
                }
              }

              // Same approach for certifications
              const certificationsStart = completeRecord.indexOf(
                "certifications = vec {"
              );
              let certifications: string[] = [];
              if (certificationsStart !== -1) {
                const startPos =
                  certificationsStart + "certifications = vec {".length;
                let braceCount = 1;
                let endPos = startPos;

                for (let i = startPos; i < completeRecord.length; i++) {
                  if (completeRecord[i] === "{") braceCount++;
                  if (completeRecord[i] === "}") {
                    braceCount--;
                    if (braceCount === 0) {
                      endPos = i;
                      break;
                    }
                  }
                }

                if (endPos > startPos) {
                  const certificationsStr = completeRecord.substring(
                    startPos,
                    endPos
                  );
                  console.log(
                    "Raw certifications string (brace counting):",
                    certificationsStr
                  );
                  certifications = certificationsStr
                    .split(";")
                    .map((s: string) => s.trim().replace(/"/g, ""))
                    .filter((s: string) => s.length > 0);
                  console.log(
                    "Parsed certifications (brace counting):",
                    certifications
                  );
                }
              }

              // Only create product if we have the essential fields
              if (
                idMatch &&
                nameMatch &&
                descriptionMatch &&
                manufacturerMatch &&
                batchNumberMatch
              ) {
                // Parse ingredients more carefully
                if (ingredientsStart !== -1) {
                  // ingredients already parsed above with brace counting
                  console.log(
                    "Using ingredients parsed with brace counting:",
                    ingredients
                  );
                } else {
                  console.log(
                    "No ingredients found for record:",
                    completeRecord
                  );
                }

                // Parse certifications more carefully
                if (certificationsStart !== -1) {
                  // certifications already parsed above with brace counting
                  console.log(
                    "Using certifications parsed with brace counting:",
                    certifications
                  );
                } else {
                  console.log(
                    "No certifications found for record:",
                    completeRecord
                  );
                }

                const product = {
                  id: idMatch[1], // Use the real canister ID
                  name: nameMatch[1] || "Unknown Product",
                  description: descriptionMatch[1] || "No description",
                  manufacturer: manufacturerMatch[1] || "Unknown Manufacturer",
                  batch_number: batchNumberMatch[1] || "No batch number",
                  production_date: Math.floor(Date.now() / 1000), // Use current timestamp
                  ingredients: ingredients,
                  certifications: certifications,
                };

                products.push(product);
                console.log("Parsed product:", product);
              } else {
                console.warn(
                  "Skipping incomplete product record:",
                  completeRecord
                );
              }
            } catch (parseError) {
              console.error("Error parsing individual product:", parseError);
            }

            recordIndex++;
          }

          currentPos = recordEnd;
        }

        console.log(
          `Successfully parsed ${products.length} products from canister`
        );
        return products;
      }

      // If no data structure found, return empty array
      console.log("No product data structure found in canister response");
      return [];
    } catch (error) {
      console.error("Error parsing dfx output:", error);
      return [];
    }
  },

  // Add a supply chain event via backend proxy
  async addSupplyChainEvent(
    product_id: string,
    event_type: string,
    location: string,
    actor: string,
    details: string,
    coordinates?: { lat: number; lng: number },
    temperature?: number,
    humidity?: number
  ): Promise<string> {
    try {
      const config = getCurrentConfig();
      console.log(
        "Adding supply chain event via backend proxy to canister:",
        config.canisterId
      );

      const response = await fetch("http://localhost:3002/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id,
          event_type,
          location,
          actor,
          details,
          coordinates,
          temperature,
          humidity,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Clear cache to ensure fresh data
        this.clearCache();
        return data.result;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error adding supply chain event:", error);
      throw new Error("Failed to add supply chain event");
    }
  },

  // Get supply chain trace for a product
  async getSupplyChainTrace(batchNumber: string): Promise<SupplyChainEvent[]> {
    try {
      console.log("getSupplyChainTrace called with batchNumber:", batchNumber);
      const url = `http://localhost:3002/api/events/${batchNumber}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url);
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success && data.result) {
        console.log("Parsing result:", data.result);
        // Parse the Candid output to extract events
        const events = this.parseEventsOutput(data.result);
        console.log("Parsed events:", events);
        return events;
      }

      console.log("No successful result or empty result");
      return [];
    } catch (error) {
      console.error("Error fetching supply chain trace:", error);
      return [];
    }
  },

  // Parse events output from dfx command
  parseEventsOutput(output: string): SupplyChainEvent[] {
    try {
      console.log("parseEventsOutput called with:", output);

      // Check if we have a valid trace with events
      if (output.includes("(null)") || output.includes("opt null")) {
        console.log("Trace is null - no events found");
        return [];
      }

      // Extract events from Candid output - find the events vector with proper brace counting
      const eventsStart = output.indexOf("events = vec {");
      if (eventsStart === -1) {
        console.log("No events vector found");
        return [];
      }

      // Find the closing brace of the events vector using brace counting
      const eventsContent = output.substring(
        eventsStart + "events = vec {".length
      );
      let braceCount = 1;
      let eventsEnd = -1;

      for (let i = 0; i < eventsContent.length; i++) {
        if (eventsContent[i] === "{") {
          braceCount++;
        } else if (eventsContent[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            eventsEnd = i;
            break;
          }
        }
      }

      if (eventsEnd === -1) {
        console.log("Failed to find closing brace for events vector");
        return [];
      }

      const eventsStr = eventsContent.substring(0, eventsEnd);
      console.log("eventsStr:", eventsStr);
      console.log("eventsStr length:", eventsStr.length);
      console.log("eventsStr first 200 chars:", eventsStr.substring(0, 200));
      console.log(
        "eventsStr last 200 chars:",
        eventsStr.substring(eventsStr.length - 200)
      );

      // Debug: let's see exactly what we have
      console.log(
        "eventsStr contains 'record {':",
        eventsStr.includes("record {")
      );
      console.log("eventsStr contains 'id':", eventsStr.includes("id"));
      console.log("eventsStr contains 'actor':", eventsStr.includes("actor"));

      // Simple approach: just extract the event data directly
      const recordMatches: any[] = [];

      // The eventsStr contains the full trace response, extract events directly
      console.log("Full eventsStr:", eventsStr);

      // Look for individual event records in the string - use balanced brace counting
      const eventMatches = [];
      let currentIndex = 0;

      while (true) {
        const recordStart = eventsStr.indexOf("record {", currentIndex);
        if (recordStart === -1) break;

        // Find the complete record using balanced brace counting
        let braceCount = 1;
        let recordEnd = -1;

        for (
          let i = recordStart + "record {".length;
          i < eventsStr.length;
          i++
        ) {
          if (eventsStr[i] === "{") {
            braceCount++;
          } else if (eventsStr[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              recordEnd = i + 1;
              break;
            }
          }
        }

        if (recordEnd !== -1) {
          const fullRecord = eventsStr.substring(recordStart, recordEnd);
          eventMatches.push(fullRecord);
          currentIndex = recordEnd;
        } else {
          break;
        }
      }

      console.log("Event matches found:", eventMatches.length);

      if (eventMatches.length > 0) {
        eventMatches.forEach((eventStr, index) => {
          console.log(`Processing event ${index + 1}:`, eventStr);

          // Only process events that have all required fields
          const hasId = eventStr.includes("id =");
          const hasActor = eventStr.includes("actor =");
          const hasDetails = eventStr.includes("details =");
          const hasLocation = eventStr.includes("location =");
          const hasEventType = eventStr.includes("event_type =");

          if (hasId && hasActor && hasDetails && hasLocation && hasEventType) {
            // Create event object from this record
            const event: any = {
              id: eventStr.match(/id\s*=\s*"([^"]+)"/)?.[1] || "unknown",
              actor: eventStr.match(/actor\s*=\s*"([^"]+)"/)?.[1] || "unknown",
              product_id:
                eventStr.match(/product_id\s*=\s*"([^"]+)"/)?.[1] || "unknown",
              timestamp: parseInt(
                eventStr.match(/timestamp\s*=\s*(\d+)/)?.[1] || "0"
              ),
              details:
                eventStr.match(/details\s*=\s*"([^"]+)"/)?.[1] || "unknown",
              location:
                eventStr.match(/location\s*=\s*"([^"]+)"/)?.[1] || "unknown",
              event_type:
                eventStr
                  .match(/event_type\s*=\s*variant\s*\{\s*([^}]+)\s*\}/)?.[1]
                  ?.trim() || "unknown",
              temperature:
                eventStr.match(
                  /temperature\s*=\s*opt\s*\(([0-9.]+)\s*:\s*float64\)/
                )?.[1] || undefined,
              humidity:
                eventStr.match(
                  /humidity\s*=\s*opt\s*\(([0-9.]+)\s*:\s*float64\)/
                )?.[1] || undefined,
              coordinates: undefined,
            };

            // Extract coordinates if present
            const coordsMatch = eventStr.match(
              /coordinates\s*=\s*opt\s*record\s*\{([^}]+)\}/
            );
            if (coordsMatch) {
              const coordsStr = coordsMatch[1];
              const latMatch = coordsStr.match(/([0-9.]+)\s*:\s*float64/);
              const lngMatch = coordsStr.match(/([0-9.]+)\s*:\s*float64/);
              if (latMatch && lngMatch) {
                event.coordinates = {
                  lat: parseFloat(latMatch[1]),
                  lng: parseFloat(lngMatch[1]),
                };
              }
            }

            console.log(`Created valid event ${index + 1}:`, event);
            recordMatches.push(event);
          } else {
            console.log(
              `Skipping incomplete event ${index + 1} - missing required fields`
            );
          }
        });
      } else {
        console.log("No event records found in eventsStr");
      }

      console.log("recordMatches:", recordMatches);

      if (recordMatches.length === 0) {
        console.log("No record matches found");
        return [];
      }

      const parsedEvents = recordMatches
        .map((event, index) => {
          // Since we're now creating the event object directly above, just return it
          console.log(`Returning event ${index}:`, event);
          return event;
        })
        .filter((event): event is SupplyChainEvent => event !== null); // Remove null entries with proper typing

      console.log("Final parsed events:", parsedEvents);
      return parsedEvents;
    } catch (error) {
      console.error("Error parsing events output:", error);
      return [];
    }
  },

  parseEventType(typeStr: string): string {
    // Map the numeric event type to string
    const eventTypes: { [key: string]: string } = {
      "661_752_345": "Production",
      "1_234_567_890": "QualityCheck",
      "2_345_678_901": "Packaging",
      "3_456_789_012": "Shipping",
      "4_567_890_123": "Customs",
      "5_678_901_234": "Delivery",
      "6_789_012_345": "Retail",
    };

    console.log("parseEventType called with typeStr:", typeStr);
    console.log("Available event types:", Object.keys(eventTypes));
    console.log("Looking for exact match for:", typeStr);

    const result = eventTypes[typeStr] || "Unknown";
    console.log("Event type result:", result);

    if (result === "Unknown") {
      console.warn("No mapping found for event type:", typeStr);
      console.warn(
        "This might be a new event type that needs to be added to the mapping"
      );
    }

    return result;
  },

  // Get all supply chain events via backend proxy
  async getAllEvents(): Promise<SupplyChainEvent[]> {
    try {
      // Check cache first
      if (
        this.cache.events.data &&
        this.isCacheValid(this.cache.events.timestamp)
      ) {
        return this.cache.events.data;
      }

      const response = await fetch("http://localhost:3002/api/events");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.result) {
        // Parse the real events from the backend
        const events = this.parseRealEvents(data.result);

        // Update cache
        this.cache.events.data = events;
        this.cache.events.timestamp = Date.now();

        return events;
      }

      return [];
    } catch (error) {
      console.error("Error fetching all events:", error);
      return [];
    }
  },

  // Parse real events from backend response
  parseRealEvents(eventsData: any[]): SupplyChainEvent[] {
    try {
      if (!Array.isArray(eventsData)) {
        return [];
      }

      return eventsData.map((event: any, index: number) => ({
        id: event.id || `event-${index}`,
        product_id: event.product_id || "unknown",
        event_type: event.event_type || "Unknown",
        location: event.location || "Unknown Location",
        timestamp: event.timestamp || Date.now(),
        actor: event.actor || "Unknown Actor",
        details: event.details || "Event recorded",
        coordinates: event.coordinates || undefined,
        temperature: event.temperature || undefined,
        humidity: event.humidity || undefined,
      }));
    } catch (error) {
      console.error("Error parsing real events:", error);
      return [];
    }
  },

  // Get comprehensive dashboard data
  async getSupplyChain(): Promise<{
    totalProducts: number;
    totalEvents: number;
    recentEvents: Array<{
      id: string;
      productName: string;
      eventType: string;
      timestamp: string;
      location: string;
    }>;
  }> {
    try {
      // Get all products and events in parallel with timeout
      const [products, events] = await Promise.all([
        this.getAllProducts(),
        this.getAllEvents(),
      ]);

      // Calculate statistics
      const totalProducts = products.length;
      const totalEvents = events.length;

      // Get recent events (last 5 events, sorted by timestamp)
      const recentEvents = events
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map((event) => {
          // Find the product name for this event
          const product = products.find((p) => p.id === event.product_id);
          return {
            id: event.id,
            productName: product ? product.name : "Unknown Product",
            eventType: event.event_type,
            timestamp: new Date(event.timestamp).toISOString(),
            location: event.location,
          };
        });

      return {
        totalProducts,
        totalEvents,
        recentEvents,
      };
    } catch (error) {
      console.error("Error fetching supply chain data for dashboard:", error);
      // Return default values on error to prevent loading state from hanging
      return {
        totalProducts: 0,
        totalEvents: 0,
        recentEvents: [],
      };
    }
  },
};
