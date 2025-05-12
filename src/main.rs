use axum::{
    routing::{get, post},
    extract::{State, Json},
    Router,
    http::{HeaderValue, Method},
};
use tower_http::cors::{CorsLayer, Any};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use axum::response::IntoResponse;
mod utils;
use utils::orderbook::Orderbook;
use utils::orders::{Order, Side};
use utils::fhe_operations;
mod api;
use api::orders::{get_orders, add_order, market_buy, market_sell, get_fills, generate_keys};
use api::config::{get_config, update_config};
type AppState = Arc<Mutex<Orderbook>>;

#[tokio::main]
async fn main() {
    // Initialize FHE system if keys exist
    if let Err(e) = fhe_operations::init_fhe() {
        eprintln!("Warning: Failed to initialize FHE system: {}", e);
        eprintln!("You can generate keys using the /generate-keys endpoint.");
    }

    // Create an encrypted orderbook by default if FHE keys exist
    let orderbook = if utils::generate_key::keys_exist() {
        println!("Using encrypted orderbook with FHE");
        Orderbook::new_encrypted()
    } else {
        println!("Using plaintext orderbook (FHE keys not found)");
        Orderbook::new(None)
    };

    let app_state = Arc::new(Mutex::new(orderbook));

    // Set up CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        // Order management
        .route("/orders", get(get_orders))
        .route("/orders", post(add_order))
        .route("/market-buy", post(market_buy))
        .route("/market-sell", post(market_sell))
        .route("/fills", get(get_fills))
        
        // FHE key management
        .route("/generate-keys", post(generate_keys))
        
        // Configuration
        .route("/config", get(get_config))
        .route("/config", post(update_config))
        
        .with_state(app_state)
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("Server listening on {}", addr);
    
    // Bind to the address
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    
    // Run the server
    axum::Server::from_tcp(listener.into_std().unwrap())
        .unwrap()
        .serve(app.into_make_service())
        .await
        .unwrap();
}
