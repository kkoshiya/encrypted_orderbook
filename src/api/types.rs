use serde::Deserialize;

#[derive(Deserialize)]
pub struct OrderRequest {
    pub price: u32,
    pub quantity: u32,
    pub side: String,
    pub user_pubkey: String,
}
