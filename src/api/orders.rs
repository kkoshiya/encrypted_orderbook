use crate::utils::orders::{Order, Side};
use crate::api::types::OrderRequest;
use crate::utils::orderbook::Orderbook;
use crate::AppState;
use axum::{extract::State, response::IntoResponse, Json};

pub async fn get_orders(
    state: State<AppState>
) -> Json<(Vec<Order>, Vec<Order>)> {
    let orderbook = state.lock().unwrap();
    Json(orderbook.get_orders())
}

pub async fn add_order(
    state: State<AppState>,
    Json(req): Json<OrderRequest>,
) -> impl IntoResponse {

    let side = match req.side.to_lowercase().as_str() {
        "buy" => Side::Buy,
        "sell" => Side::Sell,
        _ => panic!("Invalid side: must be 'buy' or 'sell'"),
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
    
    orderbook.add_order(order);
    
    Json(serde_json::json!({ "success": true, "id": id }))
}