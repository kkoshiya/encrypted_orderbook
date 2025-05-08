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


