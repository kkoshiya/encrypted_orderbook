/**
 * ElizaOS Integration Demo for the Encrypted Orderbook
 * 
 * This script simulates the ElizaOS integration with the orderbook,
 * allowing users to interact with the orderbook using natural language.
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-message');
    const commandButtons = document.querySelectorAll('.command-button');
    
    // API endpoint
    const API_URL = 'http://localhost:3000';
    
    // Sample responses for different types of requests
    const sampleResponses = {
        placeOrder: {
            buy: "I've placed a buy order for {quantity} units at price {price}. The order has been encrypted using FHE technology, ensuring your order details remain private.",
            sell: "I've placed a sell order for {quantity} units at price {price}. Your order has been securely encrypted and added to the orderbook."
        },
        marketOrder: {
            buy: "I've placed a market buy order for {quantity} units. The order has been matched with the best available sell orders.",
            sell: "I've placed a market sell order for {quantity} units. The order has been matched with the best available buy orders."
        },
        checkOrderbook: "Here's the current state of the orderbook:\n\n- Buy Orders: {buyCount} orders\n- Sell Orders: {sellCount} orders\n\nThe orderbook is currently using {encryption} encryption.",
        checkFills: "I found {fillCount} recent fills in the orderbook. The most recent fill was for {quantity} units at price {price}.",
        toggleEncryption: {
            enable: "I've enabled encryption for the orderbook. All new orders will now be encrypted using FHE.",
            disable: "I've disabled encryption for the orderbook. Orders will now be processed in plaintext mode."
        },
        generateKeys: "I've generated new FHE keys for the orderbook. These keys will be used to encrypt and decrypt order data.",
        unknown: "I'm not sure how to help with that. Try asking me to place an order, check the orderbook status, or manage encryption settings."
    };
    
    // Add a message to the chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Process user input
    async function processInput(text) {
        addMessage(text, true);
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot-message', 'typing');
        typingIndicator.textContent = '...';
        chatMessages.appendChild(typingIndicator);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remove typing indicator
        chatMessages.removeChild(typingIndicator);
        
        // Process the message
        const lowerText = text.toLowerCase();
        
        try {
            if (lowerText.includes('place') && lowerText.includes('buy') && !lowerText.includes('market')) {
                // Extract price and quantity
                const quantityMatch = lowerText.match(/(\d+)\s*units?/);
                const priceMatch = lowerText.match(/price\s*(\d+)/);
                
                if (quantityMatch && priceMatch) {
                    const quantity = parseInt(quantityMatch[1]);
                    const price = parseInt(priceMatch[1]);
                    
                    // Call the API to place the order
                    const response = await fetch(`${API_URL}/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            price,
                            quantity,
                            side: 'buy',
                            user_pubkey: 'elizaos_user'
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        addMessage(sampleResponses.placeOrder.buy
                            .replace('{quantity}', quantity)
                            .replace('{price}', price));
                    } else {
                        addMessage(`I couldn't place the order. Error: ${data.error || 'Unknown error'}`);
                    }
                } else {
                    addMessage("I need both a quantity and price to place a limit buy order. For example: 'Place a buy order for 5 units at price 100'");
                }
            } else if (lowerText.includes('place') && lowerText.includes('sell') && !lowerText.includes('market')) {
                // Extract price and quantity
                const quantityMatch = lowerText.match(/(\d+)\s*units?/);
                const priceMatch = lowerText.match(/price\s*(\d+)/);
                
                if (quantityMatch && priceMatch) {
                    const quantity = parseInt(quantityMatch[1]);
                    const price = parseInt(priceMatch[1]);
                    
                    // Call the API to place the order
                    const response = await fetch(`${API_URL}/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            price,
                            quantity,
                            side: 'sell',
                            user_pubkey: 'elizaos_user'
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        addMessage(sampleResponses.placeOrder.sell
                            .replace('{quantity}', quantity)
                            .replace('{price}', price));
                    } else {
                        addMessage(`I couldn't place the order. Error: ${data.error || 'Unknown error'}`);
                    }
                } else {
                    addMessage("I need both a quantity and price to place a limit sell order. For example: 'Place a sell order for 5 units at price 100'");
                }
            } else if (lowerText.includes('market') && lowerText.includes('buy')) {
                // Extract quantity
                const quantityMatch = lowerText.match(/(\d+)\s*units?/);
                
                if (quantityMatch) {
                    const quantity = parseInt(quantityMatch[1]);
                    
                    // Call the API to place the market order
                    const response = await fetch(`${API_URL}/market-buy`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            quantity,
                            user_pubkey: 'elizaos_user'
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        addMessage(sampleResponses.marketOrder.buy.replace('{quantity}', quantity));
                    } else {
                        addMessage(`I couldn't place the market order. Error: ${data.error || 'Unknown error'}`);
                    }
                } else {
                    addMessage("I need a quantity to place a market buy order. For example: 'Place a market buy order for 5 units'");
                }
            } else if (lowerText.includes('market') && lowerText.includes('sell')) {
                // Extract quantity
                const quantityMatch = lowerText.match(/(\d+)\s*units?/);
                
                if (quantityMatch) {
                    const quantity = parseInt(quantityMatch[1]);
                    
                    // Call the API to place the market order
                    const response = await fetch(`${API_URL}/market-sell`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            quantity,
                            user_pubkey: 'elizaos_user'
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        addMessage(sampleResponses.marketOrder.sell.replace('{quantity}', quantity));
                    } else {
                        addMessage(`I couldn't place the market order. Error: ${data.error || 'Unknown error'}`);
                    }
                } else {
                    addMessage("I need a quantity to place a market sell order. For example: 'Place a market sell order for 5 units'");
                }
            } else if ((lowerText.includes('show') || lowerText.includes('check')) && 
                      (lowerText.includes('orderbook') || lowerText.includes('orders'))) {
                // Get the current orderbook state
                const response = await fetch(`${API_URL}/orders`);
                const [buyOrders, sellOrders] = await response.json();
                
                // Get the encryption status
                const configResponse = await fetch(`${API_URL}/config`);
                const config = await configResponse.json();
                
                addMessage(sampleResponses.checkOrderbook
                    .replace('{buyCount}', buyOrders.length)
                    .replace('{sellCount}', sellOrders.length)
                    .replace('{encryption}', config.use_encryption ? 'FHE' : 'no'));
            } else if ((lowerText.includes('show') || lowerText.includes('check')) && 
                      (lowerText.includes('fills') || lowerText.includes('matches'))) {
                // Get the fills
                const response = await fetch(`${API_URL}/fills`);
                const fills = await response.json();
                
                if (fills.length > 0) {
                    const latestFill = fills[fills.length - 1];
                    addMessage(sampleResponses.checkFills
                        .replace('{fillCount}', fills.length)
                        .replace('{quantity}', latestFill.quantity)
                        .replace('{price}', latestFill.price));
                } else {
                    addMessage("There are no fills in the orderbook yet.");
                }
            } else if (lowerText.includes('enable') && lowerText.includes('encryption')) {
                // Enable encryption
                const response = await fetch(`${API_URL}/config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        use_encryption: true
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addMessage(sampleResponses.toggleEncryption.enable);
                } else {
                    addMessage(`I couldn't enable encryption. Error: ${data.error || 'Unknown error'}`);
                }
            } else if (lowerText.includes('disable') && lowerText.includes('encryption')) {
                // Disable encryption
                const response = await fetch(`${API_URL}/config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        use_encryption: false
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addMessage(sampleResponses.toggleEncryption.disable);
                } else {
                    addMessage(`I couldn't disable encryption. Error: ${data.error || 'Unknown error'}`);
                }
            } else if (lowerText.includes('generate') && 
                      (lowerText.includes('keys') || lowerText.includes('key'))) {
                // Generate FHE keys
                const response = await fetch(`${API_URL}/generate-keys`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addMessage(sampleResponses.generateKeys);
                } else {
                    addMessage(`I couldn't generate keys. Error: ${data.error || 'Unknown error'}`);
                }
            } else {
                addMessage(sampleResponses.unknown);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            addMessage("I'm having trouble connecting to the orderbook server. Please make sure it's running.");
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', function() {
        const text = userInput.value.trim();
        if (text) {
            processInput(text);
            userInput.value = '';
        }
    });
    
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const text = userInput.value.trim();
            if (text) {
                processInput(text);
                userInput.value = '';
            }
        }
    });
    
    // Sample command buttons
    commandButtons.forEach(button => {
        button.addEventListener('click', function() {
            processInput(this.textContent);
        });
    });
});
