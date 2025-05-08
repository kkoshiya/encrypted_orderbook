use super::orders::{Order, Side, Fill};
use super::fhe_operations;
use super::generate_key;
use std::sync::Arc;
use tfhe::ClientKey;

pub struct Orderbook {
    pub count: u128,
    pub buy_orders: Vec<Order>,
    pub sell_orders: Vec<Order>,
    pub fills: Vec<Fill>,
    pub use_encryption: bool,
}

impl Orderbook {
    pub fn new() -> Self {
        Self {
            count: 0,
            buy_orders: Vec::new(),
            sell_orders: Vec::new(),
            fills: Vec::new(),
            use_encryption: false,
        }
    }
    
    pub fn new_encrypted() -> Self {
        // Initialize FHE system
        if let Err(e) = fhe_operations::init_fhe() {
            eprintln!("Failed to initialize FHE: {}", e);
        }
        
        Self {
            count: 0,
            buy_orders: Vec::new(),
            sell_orders: Vec::new(),
            fills: Vec::new(),
            use_encryption: true,
        }
    }

    pub fn add_order(&mut self, mut order: Order) -> Order {
        // If encryption is enabled and the order is not already encrypted, encrypt it
        if self.use_encryption && !order.is_encrypted {
            match generate_key::load_client_key() {
                Ok(client_key) => {
                    fhe_operations::encrypt_order(&mut order, &client_key);
                    order.is_encrypted = true;
                }
                Err(e) => {
                    eprintln!("Failed to load client key for encryption: {}", e);
                }
            }
        }
        
        // Try to match the order with existing orders
        if order.side == Side::Buy {
            self.try_match_buy_order(&order);
        } else {
            self.try_match_sell_order(&order);
        }
        
        // Add the order to the appropriate list
        match order.side {
            Side::Buy => {
                self.buy_orders.push(order.clone());
                if !self.use_encryption {
                    // Sort by price (highest first) if not using encryption
                    self.buy_orders.sort_by(|a, b| b.price.cmp(&a.price));
                }
            }
            Side::Sell => {
                self.sell_orders.push(order.clone());
                if !self.use_encryption {
                    // Sort by price (lowest first) if not using encryption
                    self.sell_orders.sort_by(|a, b| a.price.cmp(&b.price));
                }
            }
        }
        
        order
    }

    pub fn get_orders(&self) -> (Vec<Order>, Vec<Order>) {
        (self.buy_orders.clone(), self.sell_orders.clone())
    }
    
    pub fn get_fills(&self) -> Vec<Fill> {
        self.fills.clone()
    }

    // Try to match a buy order with existing sell orders
    fn try_match_buy_order(&mut self, buy_order: &Order) {
        if self.sell_orders.is_empty() {
            return;
        }
        
        let mut matched_indices = Vec::new();
        let mut remaining_quantity = buy_order.quantity;
        
        if self.use_encryption {
            // Match using FHE operations
            for (i, sell_order) in self.sell_orders.iter().enumerate() {
                if remaining_quantity == 0 {
                    break;
                }
                
                // Check if the buy price is greater than or equal to the sell price
                if fhe_operations::match_orders(buy_order, sell_order) {
                    let match_quantity = remaining_quantity.min(sell_order.quantity);
                    remaining_quantity -= match_quantity;
                    
                    // Record the match
                    self.record_fill(buy_order, sell_order, match_quantity);
                    
                    // If the sell order is fully matched, mark it for removal
                    if match_quantity == sell_order.quantity {
                        matched_indices.push(i);
                    }
                }
            }
        } else {
            // Match using plaintext comparison
            for (i, sell_order) in self.sell_orders.iter().enumerate() {
                if remaining_quantity == 0 {
                    break;
                }
                
                // Check if the buy price is greater than or equal to the sell price
                if buy_order.price >= sell_order.price {
                    let match_quantity = remaining_quantity.min(sell_order.quantity);
                    remaining_quantity -= match_quantity;
                    
                    // Record the match
                    self.record_fill(buy_order, sell_order, match_quantity);
                    
                    // If the sell order is fully matched, mark it for removal
                    if match_quantity == sell_order.quantity {
                        matched_indices.push(i);
                    }
                }
            }
        }
        
        // Remove matched orders (in reverse order to maintain indices)
        for i in matched_indices.iter().rev() {
            self.sell_orders.remove(*i);
        }
    }
    
    // Try to match a sell order with existing buy orders
    fn try_match_sell_order(&mut self, sell_order: &Order) {
        if self.buy_orders.is_empty() {
            return;
        }
        
        let mut matched_indices = Vec::new();
        let mut remaining_quantity = sell_order.quantity;
        
        if self.use_encryption {
            // Match using FHE operations
            for (i, buy_order) in self.buy_orders.iter().enumerate() {
                if remaining_quantity == 0 {
                    break;
                }
                
                // Check if the buy price is greater than or equal to the sell price
                if fhe_operations::match_orders(buy_order, sell_order) {
                    let match_quantity = remaining_quantity.min(buy_order.quantity);
                    remaining_quantity -= match_quantity;
                    
                    // Record the match
                    self.record_fill(buy_order, sell_order, match_quantity);
                    
                    // If the buy order is fully matched, mark it for removal
                    if match_quantity == buy_order.quantity {
                        matched_indices.push(i);
                    }
                }
            }
        } else {
            // Match using plaintext comparison
            for (i, buy_order) in self.buy_orders.iter().enumerate() {
                if remaining_quantity == 0 {
                    break;
                }
                
                // Check if the buy price is greater than or equal to the sell price
                if buy_order.price >= sell_order.price {
                    let match_quantity = remaining_quantity.min(buy_order.quantity);
                    remaining_quantity -= match_quantity;
                    
                    // Record the match
                    self.record_fill(buy_order, sell_order, match_quantity);
                    
                    // If the buy order is fully matched, mark it for removal
                    if match_quantity == buy_order.quantity {
                        matched_indices.push(i);
                    }
                }
            }
        }
        
        // Remove matched orders (in reverse order to maintain indices)
        for i in matched_indices.iter().rev() {
            self.buy_orders.remove(*i);
        }
    }
    
    // Record a fill between a buy and sell order
    fn record_fill(&mut self, buy_order: &Order, sell_order: &Order, quantity: u32) {
        let fill = Fill {
            buy_order_id: buy_order.id,
            sell_order_id: sell_order.id,
            price: sell_order.price, // Use the sell price as the execution price
            quantity,
            buyer_pubkey: buy_order.user_pubkey.clone(),
            seller_pubkey: sell_order.user_pubkey.clone(),
        };
        
        self.fills.push(fill);
    }

    pub fn market_buy(&mut self, quantity: u32, user_pubkey: String) -> Option<Order> {
        if self.sell_orders.is_empty() {
            return None;
        }
        
        // Create a market buy order with a very high price to ensure it matches
        self.count += 1;
        let market_order = Order::new(
            self.count,
            u32::MAX, // Maximum price to ensure it matches with any sell order
            quantity,
            Side::Buy,
            user_pubkey,
        );
        
        // Add the order to the orderbook (which will trigger matching)
        let result = self.add_order(market_order);
        Some(result)
    }
    
    pub fn market_sell(&mut self, quantity: u32, user_pubkey: String) -> Option<Order> {
        if self.buy_orders.is_empty() {
            return None;
        }
        
        // Create a market sell order with a very low price to ensure it matches
        self.count += 1;
        let market_order = Order::new(
            self.count,
            0, // Minimum price to ensure it matches with any buy order
            quantity,
            Side::Sell,
            user_pubkey,
        );
        
        // Add the order to the orderbook (which will trigger matching)
        let result = self.add_order(market_order);
        Some(result)
    }
        
    // Get decrypted orders (for display purposes)
    pub fn get_decrypted_orders(&self) -> Result<(Vec<Order>, Vec<Order>), String> {
        if !self.use_encryption {
            return Ok(self.get_orders());
        }
        
        let client_key = match generate_key::load_client_key() {
            Ok(key) => key,
            Err(e) => return Err(format!("Failed to load client key: {}", e)),
        };
        
        let mut decrypted_buy_orders = Vec::new();
        let mut decrypted_sell_orders = Vec::new();
        
        // Decrypt buy orders
        for order in &self.buy_orders {
            if order.is_encrypted {
                let (price, quantity) = fhe_operations::decrypt_order(order, &client_key);
                let mut decrypted = order.clone();
                decrypted.price = price;
                decrypted.quantity = quantity;
                decrypted.is_encrypted = false;
                decrypted_buy_orders.push(decrypted);
            } else {
                decrypted_buy_orders.push(order.clone());
            }
        }
        
        // Decrypt sell orders
        for order in &self.sell_orders {
            if order.is_encrypted {
                let (price, quantity) = fhe_operations::decrypt_order(order, &client_key);
                let mut decrypted = order.clone();
                decrypted.price = price;
                decrypted.quantity = quantity;
                decrypted.is_encrypted = false;
                decrypted_sell_orders.push(decrypted);
            } else {
                decrypted_sell_orders.push(order.clone());
            }
        }
        
        // Sort the decrypted orders
        decrypted_buy_orders.sort_by(|a, b| b.price.cmp(&a.price)); // Highest first
        decrypted_sell_orders.sort_by(|a, b| a.price.cmp(&b.price)); // Lowest first
        
        Ok((decrypted_buy_orders, decrypted_sell_orders))
    }
}