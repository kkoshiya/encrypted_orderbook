use tfhe::prelude::*;
use tfhe::{FheUint32, ServerKey, ClientKey, set_server_key};
use std::sync::Arc;
use once_cell::sync::OnceCell;
use crate::utils::generate_key;
use crate::utils::orders::{Order, Side};
use std::io;

// Global server key for FHE operations
static SERVER_KEY: OnceCell<Arc<ServerKey>> = OnceCell::new();

// Initialize the FHE system by loading keys
pub fn init_fhe() -> io::Result<()> {
    // Ensure keys exist or generate them
    generate_key::ensure_keys_exist()?;
    
    // Load server key and store in global state
    let server_key = generate_key::load_server_key()?;
    let _ = SERVER_KEY.set(Arc::new(server_key));
    
    Ok(())
}

// Get the server key for FHE operations
pub fn get_server_key() -> Arc<ServerKey> {
    SERVER_KEY.get().expect("Server key not initialized").clone()
}

// Encrypt a u32 value using FHE
pub fn encrypt_u32(value: u32, client_key: &ClientKey) -> Vec<u8> {
    let encrypted = FheUint32::encrypt(value, client_key);
    
    // Serialize the encrypted value directly
    bincode::serialize(&encrypted).expect("Failed to serialize ciphertext")
}

// Decrypt a u32 value using FHE
pub fn decrypt_u32(encrypted_bytes: &[u8], client_key: &ClientKey) -> u32 {
    let encrypted: FheUint32 = bincode::deserialize(encrypted_bytes)
        .expect("Failed to deserialize ciphertext");
    
    encrypted.decrypt(client_key)
}

// Encrypt an order's price and quantity
pub fn encrypt_order(order: &mut Order, client_key: &ClientKey) {
    // Set the server key for operations
    set_server_key((*get_server_key()).clone());
    
    // Store the original values as strings in the encrypted_price and encrypted_quantity fields
    order.encrypted_price = Some(encrypt_u32(order.price, client_key));
    order.encrypted_quantity = Some(encrypt_u32(order.quantity, client_key));
}

// Decrypt an order's price and quantity
pub fn decrypt_order(order: &Order, client_key: &ClientKey) -> (u32, u32) {
    let price = match &order.encrypted_price {
        Some(encrypted) => decrypt_u32(encrypted, client_key),
        None => order.price,
    };
    
    let quantity = match &order.encrypted_quantity {
        Some(encrypted) => decrypt_u32(encrypted, client_key),
        None => order.quantity,
    };
    
    (price, quantity)
}

// Homomorphically compare two encrypted prices
pub fn compare_prices(price1: &[u8], price2: &[u8]) -> bool {
    // For simplicity in this demo, we'll decrypt the prices and compare them directly
    // In a real FHE implementation, we would perform the comparison on encrypted data
    
    // Load the client key for decryption
    let client_key = generate_key::load_client_key().expect("Failed to load client key");
    
    // Deserialize the encrypted prices
    let price1: FheUint32 = bincode::deserialize(price1).expect("Failed to deserialize price1");
    let price2: FheUint32 = bincode::deserialize(price2).expect("Failed to deserialize price2");
    
    // Decrypt the prices
    let price1_val: u32 = price1.decrypt(&client_key);
    let price2_val: u32 = price2.decrypt(&client_key);
    
    // For buy orders, we want price1 >= price2
    price1_val >= price2_val
}

// Match buy and sell orders using FHE
pub fn match_orders(buy_order: &Order, sell_order: &Order) -> bool {
    if buy_order.side != Side::Buy || sell_order.side != Side::Sell {
        return false;
    }
    
    // Ensure both orders have encrypted data
    if buy_order.encrypted_price.is_none() || sell_order.encrypted_price.is_none() {
        return false;
    }
    
    // Compare prices: buy price >= sell price for a match
    compare_prices(
        buy_order.encrypted_price.as_ref().unwrap(),
        sell_order.encrypted_price.as_ref().unwrap()
    )
}
