// ICP Canister Configuration
export const config = {
  canisterId: "uxrrr-q7777-77774-qaaaq-cai", // Our deployed supply chain canister ID
  network: "local",
  host: "http://127.0.0.1:4943", // Local ICP network port
};

// Get current configuration
export const getCurrentConfig = () => {
  return config;
};

// Update canister ID (useful after deployment)
export const updateCanisterId = (id: string) => {
  config.canisterId = id;
};

// Environment detection
export const isLocalDevelopment = () => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

// Auto-detect environment and set network
if (isLocalDevelopment()) {
  config.network = "local";
} else {
  config.network = "mainnet";
  config.host = "https://ic0.app";
}
