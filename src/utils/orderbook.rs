use super::orders::{Order, Side, Fill};

pub struct Orderbook {
    pub count: u128,
    pub buy_orders: Vec<Order>,
    pub sell_orders: Vec<Order>,
}

impl Orderbook {
    pub fn new() -> Self {
        Self {
            count: 0,
            buy_orders: Vec::new(),
            sell_orders: Vec::new(),
        }
    }

    pub fn add_order(&mut self, order: Order) {
        match order.side {
            Side::Buy => {
                self.buy_orders.push(order);
                self.buy_orders.sort_by(|a, b| b.price.cmp(&a.price));
            }
            Side::Sell => {
                self.sell_orders.push(order);
                self.sell_orders.sort_by(|a, b| a.price.cmp(&b.price));
            }
        }
    }

    pub fn get_orders(&self) -> (Vec<Order>, Vec<Order>) {
        (self.buy_orders.clone(), self.sell_orders.clone())
    }
        
}