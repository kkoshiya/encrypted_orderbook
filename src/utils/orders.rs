use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Side {
    Buy,
    Sell,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: u128,
    pub price: u32,
    pub quantity: u32,
    pub side: Side,
    pub user_pubkey: String,
}


impl Order {
    pub fn new(id: u128, price: u32, quantity: u32, side: Side, user_pubkey: String) -> Self {
        Self {
            id,
            price,
            quantity,
            side,
            user_pubkey,
        }
    }
}

#[derive(Debug, Clone)]
pub struct Fill {
    pub buy_order_id: u128,
    pub sell_order_id: u128,
    pub price: u32,
    pub quantity: u32,
    pub buyer_pubkey: String,  
    pub seller_pubkey: String, 
}

#[derive(Deserialize)]
pub struct OrderRequest {
    pub price: u32,
    pub quantity: u32,
    pub side: String,
    pub user_pubkey: String,
}
