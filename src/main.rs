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
mod api;
use api::orders::{get_orders, add_order};
type AppState = Arc<Mutex<Orderbook>>;

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
