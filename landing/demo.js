// Demo JavaScript for interacting with the encrypted orderbook API
document.addEventListener('DOMContentLoaded', function() {
    // API endpoint - use relative URL to avoid CORS issues in the preview
    const API_URL = '/api';
    
    // For demo purposes, we'll simulate API responses if the server isn't available
    const DEMO_MODE = true;
    
    // Demo data for simulation
    const demoData = {
        config: { use_encryption: true },
        buyOrders: [
            { id: 1, price: 100, quantity: 5, user_pubkey: 'user1', is_encrypted: true },
            { id: 3, price: 95, quantity: 3, user_pubkey: 'user2', is_encrypted: true }
        ],
        sellOrders: [
            { id: 2, price: 105, quantity: 8, user_pubkey: 'user3', is_encrypted: true },
            { id: 4, price: 110, quantity: 2, user_pubkey: 'user4', is_encrypted: true }
        ],
        fills: [
            { buy_order_id: 1, sell_order_id: 2, price: 105, quantity: 3, buyer_pubkey: 'user1', seller_pubkey: 'user3' }
        ]
    };
    
    // DOM elements
    const orderTypeSelect = document.getElementById('order-type');
    const orderForm = document.getElementById('order-form');
    const marketOrderForm = document.getElementById('market-order-form');
    const buyOrdersContainer = document.getElementById('buy-orders');
    const sellOrdersContainer = document.getElementById('sell-orders');
    const fillsContainer = document.getElementById('fills');
    const configContainer = document.getElementById('config-status');
    const toggleEncryptionBtn = document.getElementById('toggle-encryption');
    
    // Show the appropriate form based on order type selection
    orderTypeSelect.addEventListener('change', function() {
        if (this.value === 'limit') {
            orderForm.style.display = 'block';
            marketOrderForm.style.display = 'none';
        } else {
            orderForm.style.display = 'none';
            marketOrderForm.style.display = 'block';
        }
    });
    
    // Load current configuration
    function loadConfig() {
        fetch(`${API_URL}/config`)
            .then(response => response.json())
            .then(data => {
                configContainer.innerHTML = `
                    <div class="config-item">
                        <span class="label">Encryption:</span>
                        <span class="value ${data.use_encryption ? 'enabled' : 'disabled'}">
                            ${data.use_encryption ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                `;
                toggleEncryptionBtn.textContent = data.use_encryption ? 'Disable Encryption' : 'Enable Encryption';
            })
            .catch(error => {
                console.error('Error loading config:', error);
                configContainer.innerHTML = '<p class="error">Error loading configuration</p>';
            });
    }
    
    // Toggle encryption
    toggleEncryptionBtn.addEventListener('click', function() {
        const newState = this.textContent.includes('Disable') ? false : true;
        
        apiRequest('/config', 'POST', { use_encryption: newState })
            .then(data => {
                if (data.success) {
                    loadConfig();
                    loadOrders();
                    alert(data.message);
                } else {
                    alert(`Error: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error toggling encryption:', error);
                alert('Failed to toggle encryption. See console for details.');
            });
    });
    });
    
    // Load orders
    function loadOrders() {
        fetch(`${API_URL}/orders`)
            .then(response => response.json())
            .then(data => {
                const [buyOrders, sellOrders] = data;
                
                // Display buy orders
                if (buyOrders.length === 0) {
                    buyOrdersContainer.innerHTML = '<p class="no-orders">No buy orders</p>';
                } else {
                    buyOrdersContainer.innerHTML = buyOrders.map(order => `
                        <div class="order buy-order">
                            <div class="order-id">ID: ${order.id}</div>
                            <div class="order-price">Price: ${order.price}</div>
                            <div class="order-quantity">Quantity: ${order.quantity}</div>
                            <div class="order-encrypted ${order.is_encrypted ? 'yes' : 'no'}">
                                ${order.is_encrypted ? 'Encrypted' : 'Plaintext'}
                            </div>
                        </div>
                    `).join('');
                }
                
                // Display sell orders
                if (sellOrders.length === 0) {
                    sellOrdersContainer.innerHTML = '<p class="no-orders">No sell orders</p>';
                } else {
                    sellOrdersContainer.innerHTML = sellOrders.map(order => `
                        <div class="order sell-order">
                            <div class="order-id">ID: ${order.id}</div>
                            <div class="order-price">Price: ${order.price}</div>
                            <div class="order-quantity">Quantity: ${order.quantity}</div>
                            <div class="order-encrypted ${order.is_encrypted ? 'yes' : 'no'}">
                                ${order.is_encrypted ? 'Encrypted' : 'Plaintext'}
                            </div>
                        </div>
                    `).join('');
                }
            })
            .catch(error => {
                console.error('Error loading orders:', error);
                buyOrdersContainer.innerHTML = '<p class="error">Error loading buy orders</p>';
                sellOrdersContainer.innerHTML = '<p class="error">Error loading sell orders</p>';
            });
    }
    
    // Load fills
    function loadFills() {
        fetch(`${API_URL}/fills`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    fillsContainer.innerHTML = '<p class="no-fills">No fills</p>';
                } else {
                    fillsContainer.innerHTML = data.map(fill => `
                        <div class="fill">
                            <div class="fill-ids">
                                <span class="buy-id">Buy ID: ${fill.buy_order_id}</span>
                                <span class="sell-id">Sell ID: ${fill.sell_order_id}</span>
                            </div>
                            <div class="fill-details">
                                <span class="fill-price">Price: ${fill.price}</span>
                                <span class="fill-quantity">Quantity: ${fill.quantity}</span>
                            </div>
                            <div class="fill-users">
                                <span class="buyer">Buyer: ${fill.buyer_pubkey}</span>
                                <span class="seller">Seller: ${fill.seller_pubkey}</span>
                            </div>
                        </div>
                    `).join('');
                }
            })
            .catch(error => {
                console.error('Error loading fills:', error);
                fillsContainer.innerHTML = '<p class="error">Error loading fills</p>';
            });
    }
    
    // Submit limit order
    document.getElementById('submit-order').addEventListener('click', function() {
        const price = parseInt(document.getElementById('limit-price').value);
        const quantity = parseInt(document.getElementById('limit-quantity').value);
        const side = document.getElementById('limit-side').value;
        const pubkey = document.getElementById('limit-pubkey').value;
        
        if (!price || !quantity || !pubkey) {
            alert('Please fill in all fields');
            return;
        }
        
        fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                price,
                quantity,
                side,
                user_pubkey: pubkey
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Order placed successfully! Order ID: ${data.id}`);
                // Clear form
                document.getElementById('limit-price').value = '';
                document.getElementById('limit-quantity').value = '';
                document.getElementById('limit-pubkey').value = '';
                // Reload orders and fills
                loadOrders();
                loadFills();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error placing order:', error);
            alert('Failed to place order. See console for details.');
        });
    });
    
    // Submit market order
    document.getElementById('submit-market-order').addEventListener('click', function() {
        const quantity = parseInt(document.getElementById('market-quantity').value);
        const side = document.getElementById('market-side').value;
        const pubkey = document.getElementById('market-pubkey').value;
        
        if (!quantity || !pubkey) {
            alert('Please fill in all fields');
            return;
        }
        
        const endpoint = side === 'buy' ? 'market-buy' : 'market-sell';
        
        fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quantity,
                user_pubkey: pubkey
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Market order placed successfully! Order ID: ${data.id}`);
                // Clear form
                document.getElementById('market-quantity').value = '';
                document.getElementById('market-pubkey').value = '';
                // Reload orders and fills
                loadOrders();
                loadFills();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error placing market order:', error);
            alert('Failed to place market order. See console for details.');
        });
    });
    
    // Generate FHE keys
    document.getElementById('generate-keys').addEventListener('click', function() {
        fetch(`${API_URL}/generate-keys`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadConfig();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error generating keys:', error);
            alert('Failed to generate keys. See console for details.');
        });
    });
    
    // Auto-refresh data
    function refreshData() {
        loadOrders();
        loadFills();
        loadConfig();
    }
    
    // Initial load
    refreshData();
    
    // Refresh every 5 seconds
    setInterval(refreshData, 5000);
});
