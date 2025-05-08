use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct OrderRequest {
    pub price: u32,
    pub quantity: u32,
    pub side: String,
    pub user_pubkey: String,
}

#[derive(Deserialize)]
pub struct MarketOrderRequest {
    pub quantity: u32,
    pub user_pubkey: String,
}

#[derive(Serialize, Deserialize)]
pub struct OrderbookConfig {
    pub use_encryption: bool,
}
