use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

use crate::utils::orderbook::Orderbook;

#[derive(Serialize)]
pub struct ConfigResponse {
    use_encryption: bool,
}

#[derive(Deserialize)]
pub struct ConfigRequest {
    use_encryption: bool,
}

#[derive(Serialize)]
pub struct ConfigUpdateResponse {
    success: bool,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

pub async fn get_config(
    State(orderbook): State<Arc<Mutex<Orderbook>>>,
) -> impl IntoResponse {
    let orderbook = orderbook.lock().unwrap();
    
    let response = ConfigResponse {
        use_encryption: orderbook.is_using_encryption(),
    };
    
    (StatusCode::OK, Json(response))
}

pub async fn update_config(
    State(orderbook): State<Arc<Mutex<Orderbook>>>,
    Json(request): Json<ConfigRequest>,
) -> impl IntoResponse {
    let mut orderbook = orderbook.lock().unwrap();
    
    // Update the encryption setting
    orderbook.set_use_encryption(request.use_encryption);
    
    let response = ConfigUpdateResponse {
        success: true,
        message: format!("Encryption has been {}", if request.use_encryption { "enabled" } else { "disabled" }),
        error: None,
    };
    
    (StatusCode::OK, Json(response))
}
