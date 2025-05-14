use axum::{
    extract::State,
    response::Json,
};
use crate::AppState;
use serde_json::{json, Value};

/// Reset the orderbook state
/// 
/// This endpoint clears all orders and fills from the orderbook,
/// but maintains the current encryption settings.
pub async fn reset_orderbook(
    State(state): State<AppState>,
) -> Json<Value> {
    let mut orderbook = state.lock().unwrap();
    
    // Store the current encryption setting
    let use_encryption = orderbook.is_using_encryption();
    let server_key = orderbook.server_key.clone();
    
    // Reset the orderbook while maintaining encryption settings
    *orderbook = if use_encryption && server_key.is_some() {
        crate::utils::orderbook::Orderbook::new(server_key)
    } else {
        crate::utils::orderbook::Orderbook::new(None)
    };
    
    // Restore encryption setting
    orderbook.set_use_encryption(use_encryption);
    
    Json(json!({
        "success": true,
        "message": "Orderbook has been reset",
        "use_encryption": use_encryption
    }))
}
