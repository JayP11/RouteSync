# 🔗 Blockchain-Based Supply Chain Transparency

A comprehensive application that uses **ICP (Internet Computer Protocol)** to create a transparent, tamper-proof record of supply chain data, from production to delivery, ensuring product authenticity and ethical sourcing.

## 🌟 Features

- **Product Management**: Create and track products with detailed information
- **Supply Chain Events**: Record every step in the product journey
- **Participant Management**: Manage manufacturers, suppliers, distributors, and retailers
- **Real-time Tracking**: Monitor product location, temperature, and humidity
- **Blockchain Verification**: Tamper-proof records using ICP blockchain
- **Modern UI**: Beautiful, responsive interface built with Material-UI
- **Rust Backend**: High-performance canister logic written in Rust

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   ICP Network   │    │   Rust Canister │
│   (React + TS)  │◄──►│   (Blockchain)  │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable version)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (ICP development kit)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Supply_Chain
   ```

2. **Install Rust dependencies**

   ```bash
   cargo build
   ```

3. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   ```

4. **Start local ICP network**

   ```bash
   dfx start --background
   ```

5. **Deploy the canister**

   ```bash
   dfx deploy
   ```

6. **Start the frontend**
   ```bash
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
Supply_Chain/
├── src/                    # Rust backend source code
│   └── lib.rs             # Main canister logic
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── App.tsx        # Main application component
│   │   └── index.tsx      # Application entry point
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── supply_chain.did       # Candid interface definition
├── dfx.json              # ICP deployment configuration
├── Cargo.toml            # Rust dependencies
└── README.md             # This file
```

## 🔧 Backend (Rust Canister)

The backend is built as an ICP canister using Rust, providing:

- **Product Management**: Create, read, and manage products
- **Event Tracking**: Record supply chain events with metadata
- **Participant Management**: Manage supply chain participants
- **Data Integrity**: Immutable blockchain records
- **Query Functions**: Efficient data retrieval

### Key Functions

- `create_product()` - Add new products to the supply chain
- `add_supply_chain_event()` - Record events in the product journey
- `register_participant()` - Add new supply chain participants
- `get_supply_chain_trace()` - Retrieve complete product history
- `verify_product_authenticity()` - Validate product authenticity

## 🎨 Frontend (React + TypeScript)

The frontend provides a modern, intuitive interface built with:

- **React 18** with TypeScript
- **Material-UI** for beautiful, responsive design
- **React Router** for navigation
- **Real-time updates** and interactive components

### Pages

1. **Dashboard** - Overview of supply chain statistics
2. **Products** - Manage and view all products
3. **Create Product** - Add new products with step-by-step wizard
4. **Trace Product** - View complete supply chain journey
5. **Participants** - Manage supply chain participants
6. **Add Event** - Record new supply chain events

## 🌐 ICP Integration

### Network Configuration

- **Local Development**: `dfx start --background`
- **Mainnet**: Deploy to ICP mainnet using `dfx deploy --network ic`

### Canister Management

```bash
# Deploy canister
dfx deploy

# Upgrade canister
dfx deploy --upgrade-unchanged

# View canister status
dfx canister status supply_chain

# Call canister functions
dfx canister call supply_chain get_all_products
```

## 📊 Data Models

### Product

```rust
pub struct Product {
    pub id: String,
    pub name: String,
    pub description: String,
    pub manufacturer: String,
    pub batch_number: String,
    pub production_date: DateTime<Utc>,
    pub ingredients: Vec<String>,
    pub certifications: Vec<String>,
}
```

### Supply Chain Event

```rust
pub struct SupplyChainEvent {
    pub id: String,
    pub product_id: String,
    pub event_type: EventType,
    pub location: String,
    pub timestamp: DateTime<Utc>,
    pub actor: String,
    pub details: String,
    pub coordinates: Option<(f64, f64)>,
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
}
```

## 🔐 Security Features

- **Immutable Records**: Once written, data cannot be modified
- **Participant Verification**: Verified participant system
- **GPS Tracking**: Location verification for events
- **Environmental Monitoring**: Temperature and humidity tracking
- **Blockchain Integrity**: Tamper-proof using ICP consensus

## 🚀 Deployment

### Local Development

```bash
# Start local network
dfx start --background

# Deploy canister
dfx deploy

# Start frontend
cd frontend && npm start
```

### Production Deployment

```bash
# Deploy to ICP mainnet
dfx deploy --network ic

# Build frontend for production
cd frontend && npm run build

# Deploy frontend to your preferred hosting service
```

## 🧪 Testing

### Backend Testing

```bash
# Run Rust tests
cargo test

# Test canister locally
dfx canister call supply_chain create_product '("Test Product", "Description", "Manufacturer", "B001", vec!{"Ingredient"}, vec!{"Cert"})'
```

### Frontend Testing

```bash
cd frontend
npm test
```

## 📈 Monitoring & Analytics

- **Real-time Dashboard**: Live supply chain statistics
- **Event Timeline**: Visual representation of product journey
- **Participant Activity**: Track participant engagement
- **System Status**: Monitor ICP network connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Community**: Join the ICP developer community

## 🔮 Future Enhancements

- **IoT Integration**: Real-time sensor data from IoT devices
- **AI Analytics**: Predictive analytics for supply chain optimization
- **Mobile App**: Native mobile applications
- **API Gateway**: RESTful API for third-party integrations
- **Multi-chain Support**: Integration with other blockchain networks

---

**Built with ❤️ using Rust, React, and ICP**

_Empowering transparent and ethical supply chains through blockchain technology_
