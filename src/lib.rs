use candid::{CandidType, Deserialize};
use ic_cdk::{
    update,
    query,
    init,
};
use std::collections::HashMap;

// Simple ID generation function to replace UUID
fn generate_id() -> String {
    let timestamp = get_current_timestamp();
    let random_part = (ic_cdk::api::time() % 10000) as u32;
    format!("{}_{}", timestamp, random_part)
}

// Data structures for supply chain entities
#[derive(CandidType, Clone)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub description: String,
    pub manufacturer: String,
    pub batch_number: String,
    pub production_date: u64, // Unix timestamp
    pub ingredients: Vec<String>,
    pub certifications: Vec<String>,
}

#[derive(CandidType, Clone)]
pub struct SupplyChainEvent {
    pub id: String,
    pub product_id: String,
    pub event_type: EventType,
    pub location: String,
    pub timestamp: u64, // Unix timestamp
    pub actor: String,
    pub details: String,
    pub coordinates: Option<(f64, f64)>,
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
}

#[derive(CandidType, Deserialize, Clone)]
pub enum EventType {
    Production,
    QualityCheck,
    Packaging,
    Shipping,
    Customs,
    Delivery,
    Retail,
}

#[derive(CandidType, Clone)]
pub struct SupplyChainTrace {
    pub product_id: String,
    pub events: Vec<SupplyChainEvent>,
    pub created_at: u64, // Unix timestamp
    pub last_updated: u64, // Unix timestamp
}

// Global state variables
static mut PRODUCTS: Option<HashMap<String, Product>> = None;
static mut TRACES: Option<HashMap<String, SupplyChainTrace>> = None;
static mut EVENTS: Option<HashMap<String, SupplyChainEvent>> = None;
static mut PARTICIPANTS: Option<HashMap<String, Participant>> = None;

#[derive(CandidType, Clone)]
pub struct Participant {
    pub id: String,
    pub name: String,
    pub role: ParticipantRole,
    pub location: String,
    pub public_key: String,
    pub is_verified: bool,
}

#[derive(CandidType, Deserialize, Clone)]
pub enum ParticipantRole {
    Manufacturer,
    Supplier,
    Distributor,
    Retailer,
    Consumer,
    Auditor,
}

// Helper function to get current timestamp
fn get_current_timestamp() -> u64 {
    ic_cdk::api::time() / 1_000_000 // Convert nanoseconds to seconds
}

// Initialize the canister
#[init]
fn init() {
    unsafe {
        PRODUCTS = Some(HashMap::new());
        TRACES = Some(HashMap::new());
        EVENTS = Some(HashMap::new());
        PARTICIPANTS = Some(HashMap::new());
        
        // Debug: Log initialization
        ic_cdk::print("Canister initialized - state variables set");
    }
}

// Product management functions
#[update]
fn create_product(
    name: String,
    description: String,
    manufacturer: String,
    batch_number: String,
    ingredients: Vec<String>,
    certifications: Vec<String>,
) -> String {
    let product_id = generate_id();
    let product = Product {
        id: product_id.clone(),
        name,
        description,
        manufacturer,
        batch_number,
        production_date: get_current_timestamp(),
        ingredients,
        certifications,
    };

    unsafe {
        if let Some(products) = &mut PRODUCTS {
            products.insert(product_id.clone(), product);
            // Debug: Log product creation
            ic_cdk::print(format!("Product created with ID: {}, total products: {}", product_id, products.len()));
        } else {
            // Debug: Log if PRODUCTS is None
            ic_cdk::print("ERROR: PRODUCTS is None - state not initialized!");
        }

        // Create initial trace
        let trace = SupplyChainTrace {
            product_id: product_id.clone(),
            events: Vec::new(),
            created_at: get_current_timestamp(),
            last_updated: get_current_timestamp(),
        };
        
        if let Some(traces) = &mut TRACES {
            traces.insert(product_id.clone(), trace);
            // Debug: Log trace creation
            ic_cdk::print(format!("Trace created for product: {}, total traces: {}", product_id, traces.len()));
        } else {
            // Debug: Log if TRACES is None
            ic_cdk::print("ERROR: TRACES is None - state not initialized!");
        }
    }
    product_id
}

#[update]
fn add_supply_chain_event(
    product_id: String,
    event_type: EventType,
    location: String,
    actor: String,
    details: String,
    coordinates: Option<(f64, f64)>,
    temperature: Option<f64>,
    humidity: Option<f64>,
) -> String {
    let event_id = generate_id();
    let event = SupplyChainEvent {
        id: event_id.clone(),
        product_id: product_id.clone(),
        event_type,
        location,
        timestamp: get_current_timestamp(),
        actor,
        details,
        coordinates,
        temperature,
        humidity,
    };

    unsafe {
        // Verify product exists
        if let Some(products) = &PRODUCTS {
            if !products.contains_key(&product_id) {
                return "Product not found".to_string();
            }
        }

        // Add event to events collection
        if let Some(events) = &mut EVENTS {
            events.insert(event_id.clone(), event.clone());
        }

        // Add event to product trace
        if let Some(traces) = &mut TRACES {
            if let Some(trace) = traces.get_mut(&product_id) {
                trace.events.push(event);
                trace.last_updated = get_current_timestamp();
                // Debug: Log event addition to trace
                ic_cdk::print(format!("Event added to trace for product: {}, total events in trace: {}", product_id, trace.events.len()));
            } else {
                // Debug: Log if trace not found
                ic_cdk::print(format!("ERROR: Trace not found for product: {}", product_id));
            }
        } else {
            // Debug: Log if TRACES is None
            ic_cdk::print("ERROR: TRACES is None - state not initialized!");
        }
    }
    event_id
}

#[update]
fn register_participant(
    name: String,
    role: ParticipantRole,
    location: String,
    public_key: String,
) -> String {
    let participant_id = generate_id();
    let participant = Participant {
        id: participant_id.clone(),
        name,
        role,
        location,
        public_key,
        is_verified: false,
    };

    unsafe {
        if let Some(participants) = &mut PARTICIPANTS {
            participants.insert(participant_id.clone(), participant);
        }
    }
    participant_id
}

// Test method to debug Candid interface
#[update]
fn test_simple() -> String {
    "Hello from canister".to_string()
}

// Query functions
#[query]
fn get_product(product_id: String) -> Result<Product, String> {
    unsafe {
        if let Some(products) = &PRODUCTS {
            products.get(&product_id)
                .cloned()
                .ok_or("Product not found".to_string())
        } else {
            Err("Products not initialized".to_string())
        }
    }
}

#[query]
fn get_supply_chain_trace(product_id: String) -> Option<SupplyChainTrace> {
    unsafe {
        if let Some(traces) = &TRACES {
            traces.get(&product_id).cloned()
        } else {
            None
        }
    }
}

#[query]
fn get_all_products() -> Vec<Product> {
    unsafe {
        if let Some(products) = &PRODUCTS {
            products.values().cloned().collect()
        } else {
            Vec::new()
        }
    }
}

#[query]
fn get_participants() -> Vec<Participant> {
    unsafe {
        if let Some(participants) = &PARTICIPANTS {
            participants.values().cloned().collect()
        } else {
            Vec::new()
        }
    }
}

#[query]
fn verify_product_authenticity(product_id: String) -> Result<bool, String> {
    unsafe {
        // Check if product exists
        if let Some(products) = &PRODUCTS {
            if !products.contains_key(&product_id) {
                return Err("Product not found".to_string());
            }
        } else {
            return Err("Products not initialized".to_string());
        }

        // Check if trace exists and has events
        if let Some(traces) = &TRACES {
            if let Some(trace) = traces.get(&product_id) {
                if trace.events.is_empty() {
                    return Ok(false);
                }
                
                // Basic verification: check if events are in chronological order
                let mut prev_timestamp = trace.events[0].timestamp;
                for event in &trace.events[1..] {
                    if event.timestamp < prev_timestamp {
                        return Ok(false);
                    }
                    prev_timestamp = event.timestamp;
                }
                
                Ok(true)
            } else {
                Ok(false)
            }
        } else {
            Err("Traces not initialized".to_string())
        }
    }
}

// Note: The canister interface is defined in supply_chain.did 