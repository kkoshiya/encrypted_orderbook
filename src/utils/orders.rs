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
    // Encrypted values using FHE
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encrypted_price: Option<Vec<u8>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encrypted_quantity: Option<Vec<u8>>,
    // Flag to indicate if this order is using encryption
    #[serde(default)]
    pub is_encrypted: bool,
}

impl Order {
    pub fn new(id: u128, price: u32, quantity: u32, side: Side, user_pubkey: String) -> Self {
        Self {
            id,
            price,
            quantity,
            side,
            user_pubkey,
            encrypted_price: None,
            encrypted_quantity: None,
            is_encrypted: false,
        }
    }
    
    pub fn new_encrypted(id: u128, price: u32, quantity: u32, side: Side, user_pubkey: String, 
                        encrypted_price: Vec<u8>, encrypted_quantity: Vec<u8>) -> Self {
        Self {
            id,
            price,
            quantity,
            side,
            user_pubkey,
            encrypted_price: Some(encrypted_price),
            encrypted_quantity: Some(encrypted_quantity),
            is_encrypted: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fill {
    pub buy_order_id: u128,
    pub sell_order_id: u128,
    pub price: u32,
    pub quantity: u32,
    pub buyer_pubkey: String,
    pub seller_pubkey: String,
}
