use crate::utils::orders::{Order, Side, Fill};
use crate::api::types::{OrderRequest, MarketOrderRequest};
use crate::utils::orderbook::Orderbook;
use crate::utils::generate_key;
use crate::AppState;
use axum::{extract::State, response::IntoResponse, Json, http::StatusCode};

// Get all orders (encrypted or decrypted based on request)
pub async fn get_orders(
    state: State<AppState>
) -> Result<Json<(Vec<Order>, Vec<Order>)>, StatusCode> {
    let orderbook = state.lock().unwrap();
    
    // If the orderbook is using encryption, try to get decrypted orders for display
    if orderbook.use_encryption {
        match orderbook.get_decrypted_orders() {
            Ok(orders) => Ok(Json(orders)),
            Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        }
    } else {
        // Return plaintext orders
        Ok(Json(orderbook.get_orders()))
    }
}

// Get all fills/matches
pub async fn get_fills(
    state: State<AppState>
) -> Json<Vec<Fill>> {
    let orderbook = state.lock().unwrap();
    Json(orderbook.get_fills())
}

// Add a limit order
pub async fn add_order(
    state: State<AppState>,
    Json(req): Json<OrderRequest>,
) -> impl IntoResponse {
    let side = match req.side.to_lowercase().as_str() {
        "buy" => Side::Buy,
        "sell" => Side::Sell,
        _ => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ 
            "success": false, 
            "error": "Invalid side: must be 'buy' or 'sell'" 
        }))),
    };

    let mut orderbook = state.lock().unwrap();
    orderbook.count += 1;
    let id = orderbook.count;
    
    let order = Order::new(
        id, 
        req.price, 
        req.quantity, 
        side, 
        req.user_pubkey
    );
    
    let result = orderbook.add_order(order);
    
    (StatusCode::OK, Json(serde_json::json!({ 
        "success": true, 
        "id": id,
        "is_encrypted": result.is_encrypted
    })))
}

// Add a market buy order
pub async fn market_buy(
    state: State<AppState>,
    Json(req): Json<MarketOrderRequest>,
) -> impl IntoResponse {
    let mut orderbook = state.lock().unwrap();
    
    match orderbook.market_buy(req.quantity, req.user_pubkey) {
        Some(order) => {
            (StatusCode::OK, Json(serde_json::json!({
                "success": true,
                "id": order.id,
                "is_encrypted": order.is_encrypted
            })))
        }
        None => {
            (StatusCode::BAD_REQUEST, Json(serde_json::json!({
                "success": false,
                "error": "No matching sell orders available"
            })))
        }
    }
}

// Add a market sell order
pub async fn market_sell(
    state: State<AppState>,
    Json(req): Json<MarketOrderRequest>,
) -> impl IntoResponse {
    let mut orderbook = state.lock().unwrap();
    
    match orderbook.market_sell(req.quantity, req.user_pubkey) {
        Some(order) => {
            (StatusCode::OK, Json(serde_json::json!({
                "success": true,
                "id": order.id,
                "is_encrypted": order.is_encrypted
            })))
        }
        None => {
            (StatusCode::BAD_REQUEST, Json(serde_json::json!({
                "success": false,
                "error": "No matching buy orders available"
            })))
        }
    }
}

// Generate FHE keys
pub async fn generate_keys() -> impl IntoResponse {
    match generate_key::generate_and_save_keys() {
        Ok(_) => {
            (StatusCode::OK, Json(serde_json::json!({
                "success": true,
                "message": "FHE keys generated successfully"
            })))
        }
        Err(e) => {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
                "success": false,
                "error": format!("Failed to generate FHE keys: {}", e)
            })))
        }
    }
}