use tfhe::prelude::*;
use tfhe::{generate_keys, ClientKey, ServerKey, ConfigBuilder};
use std::fs;
use std::io::{self, Write};
use std::path::Path;

const SERVER_KEY_PATH: &str = "keys/server_key.bin";
const CLIENT_KEY_PATH: &str = "keys/client_key.bin";

/// Generate and save FHE keys for the encrypted orderbook
pub fn generate_and_save_keys() -> io::Result<()> {
    println!("Generating FHE keys...");
    
    // Create keys directory if it doesn't exist
    if !Path::new("keys").exists() {
        fs::create_dir("keys")?;
    }
    
    // Configure and generate FHE keys
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    
    // Serialize and save keys
    println!("Serializing and saving keys...");
    let server_key_bytes = bincode::serialize(&server_key)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    let client_key_bytes = bincode::serialize(&client_key)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    fs::write(SERVER_KEY_PATH, server_key_bytes)?;
    fs::write(CLIENT_KEY_PATH, client_key_bytes)?;
    
    println!("Keys generated and saved successfully");
    Ok(())
}

/// Load the server key for FHE operations
pub fn load_server_key() -> io::Result<ServerKey> {
    println!("Loading server key...");
    let key_bytes = fs::read(SERVER_KEY_PATH)?;
    bincode::deserialize(&key_bytes)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))
}

/// Load the client key for FHE operations
pub fn load_client_key() -> io::Result<ClientKey> {
    println!("Loading client key...");
    let key_bytes = fs::read(CLIENT_KEY_PATH)?;
    bincode::deserialize(&key_bytes)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))
}

/// Check if FHE keys exist
pub fn keys_exist() -> bool {
    Path::new(SERVER_KEY_PATH).exists() && Path::new(CLIENT_KEY_PATH).exists()
}

/// Main function to generate keys if they don't exist
pub fn ensure_keys_exist() -> io::Result<()> {
    if !keys_exist() {
        println!("FHE keys not found. Generating new keys...");
        generate_and_save_keys()?;
    } else {
        println!("FHE keys already exist");
    }
    Ok(())
}