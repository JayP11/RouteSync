#!/bin/bash

echo "🚀 Deploying Supply Chain Canister to ICP"
echo "=========================================="

# Check if dfx is running
if ! dfx ping --network local &> /dev/null; then
    echo "❌ Local ICP network is not running. Starting it now..."
    dfx start --background
    sleep 10
fi

echo "✅ ICP network is running"

# Build the project
echo "🔨 Building Rust canister..."
cargo build --target wasm32-unknown-unknown --release

if [ $? -eq 0 ]; then
    echo "✅ Rust build completed successfully!"
else
    echo "❌ Rust build failed"
    exit 1
fi

# Skip optimization for now since ic-cdk-optimizer is not available
echo "⚠️  Skipping WebAssembly optimization (ic-cdk-optimizer not available)"
echo "📝 Using unoptimized WASM file for deployment"

# Deploy the canister
echo "🚀 Deploying canister to local network..."
dfx deploy

if [ $? -eq 0 ]; then
    echo "✅ Canister deployed successfully!"
    
    # Get canister ID
    CANISTER_ID=$(dfx canister id supply_chain)
    echo "🎯 Canister ID: $CANISTER_ID"
    
    # Test the canister
    echo "🧪 Testing canister functionality..."
    dfx canister call supply_chain get_all_products
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Canister is running on local network"
    echo "🔗 Canister ID: $CANISTER_ID"
    echo ""
    echo "📚 Next steps:"
    echo "1. Start the frontend: cd frontend && npm start"
    echo "2. The frontend will connect to the local canister automatically"
    echo "3. Test the application at: http://localhost:3000"
    
else
    echo "❌ Canister deployment failed"
    exit 1
fi 