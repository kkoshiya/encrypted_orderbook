# FHE Orderbook for Solana

## Overview

This project implements an encrypted orderbook system using Fully Homomorphic Encryption (FHE) designed for Solana. The system allows for secure order placement and management while keeping sensitive order information encrypted.

## What is FHE?

Fully Homomorphic Encryption (FHE) is a type of encryption that allows computations to be performed directly on encrypted data without requiring decryption first. This means that the orderbook can process orders and match trades without ever exposing the underlying price and quantity information in plaintext.

## Project Structure

The project is organized as follows:

- `src/main.rs` - Entry point of the application, sets up the web server
- `src/utils/` - Core functionality
  - `orderbook.rs` - Implements the orderbook logic
  - `orders.rs` - Defines order structures and types
  - `generate_key.rs` - (Currently empty) Intended for FHE key generation
- `src/api/` - API endpoints
  - `orders.rs` - Handles API requests for order management
  - `types.rs` - Defines request/response data structures

## Core Components

### Orderbook

The `Orderbook` struct is the central component that manages buy and sell orders. It maintains two separate lists for buy and sell orders and provides methods to:

- Add new orders
- Retrieve current orders
- (Placeholder for) Execute market buy orders

Buy orders are sorted in descending order by price (highest price first), while sell orders are sorted in ascending order (lowest price first), following standard orderbook behavior.

### Orders

The system defines:

- `Order` - Represents a single order with fields for:
  - `id` - Unique identifier
  - `price` - Order price
  - `quantity` - Order quantity
  - `side` - Buy or Sell
  - `user_pubkey` - User's public key (likely for Solana account identification)

- `Side` - Enum representing order side (Buy or Sell)

### API

The application exposes a REST API with the following endpoints:

- `GET /orders` - Retrieves all current buy and sell orders
- `POST /orders` - Adds a new order to the orderbook

## Current State of Implementation

The project appears to be in early development stages:

1. The basic orderbook structure is implemented
2. API endpoints for adding and retrieving orders are functional
3. The FHE implementation is not yet complete (the `generate_key.rs` file is empty)
4. The `market_buy` function is defined but not implemented

## How to Use

### Prerequisites

- Rust and Cargo installed
- Basic understanding of Solana and public key cryptography

### Running the Server

```bash
cargo run
```

This will start the server on `127.0.0.1:3000`.

### API Usage

#### Get all orders

```bash
curl http://localhost:3000/orders
```

#### Add a new order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "price": 100,
    "quantity": 5,
    "side": "buy",
    "user_pubkey": "your_solana_public_key_here"
  }'
```

## Future Development

Areas that appear to be planned for future development:

1. Implementation of FHE for encrypted order processing
2. Completion of market order execution logic
3. Integration with Solana blockchain
4. Order matching algorithm implementation
5. Transaction settlement mechanism

## Technical Details

The project uses:

- Axum framework for the web server
- Tokio for asynchronous runtime
- Serde for serialization/deserialization
- Bincode for binary encoding (likely for FHE operations)

## Security Considerations

When fully implemented, this system would provide:

1. Privacy for order information through FHE
2. Authentication via Solana public keys
3. Secure order matching without revealing sensitive price data

Note that the current implementation does not yet include the actual FHE functionality, which would be necessary for the privacy guarantees mentioned above.
