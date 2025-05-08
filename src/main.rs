use axum::{
    routing::{get, post},
    extract::{State, Json},
    Router,
};
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
use api::types::OrderbookConfig;
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
        Orderbook::new()
    };

    let app_state = Arc::new(Mutex::new(orderbook));

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
        
        .with_state(app_state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server listening on {}", addr);
    axum::serve(
        tokio::net::TcpListener::bind(addr).await.unwrap(),
        app
    ).await.unwrap();
}

// Get current orderbook configuration
async fn get_config(state: State<AppState>) -> Json<OrderbookConfig> {
    let orderbook = state.lock().unwrap();
    Json(OrderbookConfig {
        use_encryption: orderbook.use_encryption,
    })
}

// Update orderbook configuration
async fn update_config(
    state: State<AppState>,
    Json(config): Json<OrderbookConfig>,
) -> impl IntoResponse {
    let mut orderbook = state.lock().unwrap();
    
    // If switching to encryption, make sure keys exist
    if config.use_encryption && !orderbook.use_encryption {
        if !utils::generate_key::keys_exist() {
            return Json(serde_json::json!({
                "success": false,
                "error": "Cannot enable encryption: FHE keys not found. Generate keys first."
            }));
        }
        
        // Initialize FHE system
        if let Err(e) = fhe_operations::init_fhe() {
            return Json(serde_json::json!({
                "success": false,
                "error": format!("Failed to initialize FHE system: {}", e)
            }));
        }
    }
    
    // Update configuration
    orderbook.use_encryption = config.use_encryption;
    
    Json(serde_json::json!({
        "success": true,
        "message": format!("Orderbook encryption {}", if config.use_encryption { "enabled" } else { "disabled" })
    }))
}
