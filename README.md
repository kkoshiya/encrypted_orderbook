# FHE Orderbook for Solana

## Overview

This project implements an encrypted orderbook system using Fully Homomorphic Encryption (FHE) designed for Solana. The system allows for secure order placement and management while keeping sensitive order information encrypted. The orderbook can process and match orders without ever exposing the underlying price and quantity information in plaintext.

## What is FHE?

Fully Homomorphic Encryption (FHE) is a type of encryption that allows computations to be performed directly on encrypted data without requiring decryption first. In this orderbook implementation:

- Order prices and quantities are encrypted using FHE
- Order matching is performed on the encrypted data
- Only the order owner can decrypt and view the actual values
- The orderbook operator never sees the plaintext order information

## Project Structure

The project is organized as follows:

- `src/main.rs` - Entry point of the application, sets up the web server
- `src/utils/` - Core functionality
  - `orderbook.rs` - Implements the orderbook logic with FHE support
  - `orders.rs` - Defines order structures and types
  - `generate_key.rs` - Handles FHE key generation and management
  - `fhe_operations.rs` - Implements FHE encryption, decryption, and matching operations
- `src/api/` - API endpoints
  - `orders.rs` - Handles API requests for order management
  - `types.rs` - Defines request/response data structures
  - `config.rs` - Manages orderbook configuration (encryption settings)
- `landing/` - Landing page and interactive demo
- `elizaos_integration/` - Integration with ElizaOS for natural language interaction
- `tests/` - Test scripts for verifying functionality

## Core Components

### Orderbook

The `Orderbook` struct is the central component that manages buy and sell orders. It maintains two separate lists for buy and sell orders and provides methods to:

- Add new orders (both encrypted and plaintext)
- Match orders using FHE operations
- Execute market buy and sell orders
- Retrieve current orders
- Toggle encryption on/off
- Record and retrieve fills/matches

Buy orders are sorted in descending order by price (highest price first), while sell orders are sorted in ascending order (lowest price first), following standard orderbook behavior.

### Orders

The system defines:

- `Order` - Represents a single order with fields for:
  - `id` - Unique identifier
  - `price` - Order price (can be encrypted)
  - `quantity` - Order quantity (can be encrypted)
  - `side` - Buy or Sell
  - `user_pubkey` - User's public key
  - `is_encrypted` - Flag indicating if the order is encrypted

- `Side` - Enum representing order side (Buy or Sell)

- `Fill` - Represents a matched order with:
  - `buy_order_id` - ID of the buy order
  - `sell_order_id` - ID of the sell order
  - `price` - Execution price
  - `quantity` - Execution quantity
  - `buyer_pubkey` - Buyer's public key
  - `seller_pubkey` - Seller's public key

### FHE Operations

The system implements FHE functionality using the TFHE library:

- Key generation for client and server keys
- Encryption and decryption of order data
- Homomorphic comparison operations for order matching
- Serialization and deserialization of encrypted values

### API

The application exposes a REST API with the following endpoints:

- `GET /orders` - Retrieves all current buy and sell orders
- `POST /orders` - Adds a new limit order to the orderbook
- `POST /market-buy` - Places a market buy order
- `POST /market-sell` - Places a market sell order
- `GET /fills` - Retrieves all matched orders
- `POST /generate-keys` - Generates new FHE keys
- `GET /config` - Gets current orderbook configuration
- `POST /config` - Updates orderbook configuration (toggle encryption)

## Current State of Implementation

The project is fully implemented with the following features:

1. Complete orderbook functionality with FHE support
2. API endpoints for all orderbook operations
3. FHE key generation and management
4. Order matching using homomorphic operations
5. Market and limit order support
6. Interactive demo interface
7. ElizaOS integration for natural language interaction
8. Comprehensive test suite

## How to Use

### Prerequisites

- Rust and Cargo installed
- Node.js and npm (for running tests and the demo)

### Installation

```bash
# Clone the repository
git clone https://github.com/kkoshiya/encrypted_orderbook.git
cd encrypted_orderbook

# Install dependencies
cargo build
npm install
```

### Running the Server

```bash
# Using cargo
cargo run

# Or using npm script
npm start
```

This will start the server on `127.0.0.1:3000`.

### Generating FHE Keys

Before using encryption, you need to generate FHE keys:

```bash
# Using the API
curl -X POST http://localhost:3000/generate-keys

# Or using the provided script
bash generate_keys.sh
```

### API Usage

#### Get all orders

```bash
curl http://localhost:3000/orders
```

#### Add a limit order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "price": 100,
    "quantity": 5,
    "side": "buy",
    "user_pubkey": "user1"
  }'
```

#### Place a market buy order

```bash
curl -X POST http://localhost:3000/market-buy \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3,
    "user_pubkey": "user2"
  }'
```

#### Get all fills/matches

```bash
curl http://localhost:3000/fills
```

#### Toggle encryption

```bash
curl -X POST http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -d '{
    "use_encryption": true
  }'
```

### Running Tests

```bash
npm test
```

### Demo Interface

To access the interactive demo interface:

1. Start the server: `npm start`
2. Start the landing page server: `cd landing && python3 -m http.server 8080`
3. Open a browser and navigate to: `http://localhost:8080`

## ElizaOS Integration

The project includes integration with ElizaOS, allowing users to interact with the orderbook using natural language. The integration is implemented as an ElizaOS plugin in the `plugin-orderbook` directory and provides actions for:

- Getting and placing orders (`GET_ORDERS`, `ADD_ORDER`)
- Executing market orders (`MARKET_BUY`, `MARKET_SELL`)
- Viewing trade fills (`GET_FILLS`)
- Managing FHE keys (`GENERATE_KEYS`)
- Configuring the orderbook (`GET_CONFIG`, `UPDATE_CONFIG`)
- Resetting the orderbook (`RESET_ORDERBOOK`)

### Using the ElizaOS Plugin

1. Make sure the orderbook server is running:
   ```bash
   cargo run
   ```

2. Start ElizaOS with the plugin:
   ```bash
   cd plugin-orderbook
   elizaos dev
   ```

3. Interact with the agent using natural language commands like:
   - "Show me the current orders in the orderbook"
   - "Add a buy order at price 100 with amount 5"
   - "Execute a market buy for amount 3"
   - "Generate FHE keys for the orderbook"

See the plugin's [README.md](./plugin-orderbook/README.md) for more details.

## Technical Details

The project uses:

- TFHE library for Fully Homomorphic Encryption
- Axum framework for the web server
- Tokio for asynchronous runtime
- Serde for serialization/deserialization
- Bincode for binary encoding of encrypted values

## Security Considerations

This system provides:

1. Privacy for order information through FHE
2. Authentication via user public keys
3. Secure order matching without revealing sensitive price data

The FHE implementation ensures that:
- Order data remains encrypted throughout the entire lifecycle
- The orderbook operator cannot see the plaintext values
- Order matching is performed on encrypted data
- Only the order owner can decrypt and view their own order details

## Future Development

Potential areas for future enhancement:

1. Integration with Solana blockchain for settlement
2. Performance optimizations for FHE operations
3. Advanced order types (stop-loss, take-profit, etc.)
4. Multi-asset support
5. Enhanced security features and auditing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
