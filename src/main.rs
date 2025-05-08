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
use utils::orders::{Order, Side, OrderRequest};

type AppState = Arc<Mutex<Orderbook>>;

async fn get_orders(
    state: State<AppState>
) -> Json<(Vec<Order>, Vec<Order>)> {
    let orderbook = state.lock().unwrap();
    Json(orderbook.get_orders())
}

async fn add_order(
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


#[tokio::main]
async fn main() {

    let orderbook = Orderbook::new();
    let app_state = Arc::new(Mutex::new(orderbook));

    let app = Router::new()
        .route("/orders", get(get_orders))
        .route("/orders", post(add_order))
        .with_state(app_state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server listening on {}", addr);
    axum::serve(
        tokio::net::TcpListener::bind(addr).await.unwrap(),
        app
    ).await.unwrap();
}
