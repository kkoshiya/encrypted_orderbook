/**
 * Toggle Encryption
 * Enables or disables encryption on the orderbook
 */
async function toggleEncryption() {
  // Check if keys have been generated
  if (!state.keysGenerated && !state.encryptionEnabled) {
    showNotification('You must generate FHE keys before enabling encryption', 'error');
    return;
  }
  
  try {
    // Show loading state
    elements.encryptionToggle.disabled = true;
    elements.encryptionToggle.textContent = state.encryptionEnabled ? 'Disabling...' : 'Enabling...';
    
    // Add a visual effect for encryption transition
    const orderbookSection = document.querySelector('.orderbook-section');
    if (orderbookSection) {
      const transitionOverlay = document.createElement('div');
      transitionOverlay.className = 'encryption-transition-overlay';
      transitionOverlay.innerHTML = `
        <div class="transition-animation">
          <div class="transition-icon">${state.encryptionEnabled ? '🔓' : '🔒'}</div>
          <div class="transition-text">${state.encryptionEnabled ? 'Decrypting Orderbook...' : 'Encrypting Orderbook...'}</div>
        </div>
      `;
      orderbookSection.appendChild(transitionOverlay);
      
      // Add transition styles
      const transitionStyle = document.createElement('style');
      transitionStyle.textContent = `
        .encryption-transition-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          border-radius: 8px;
        }
        
        .transition-animation {
          text-align: center;
          padding: 20px;
        }
        
        .transition-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          animation: spin 2s infinite linear;
        }
        
        .transition-text {
          font-weight: bold;
          color: #6c5ce7;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(transitionStyle);
    }
    
    // Send request to toggle encryption (with slight delay to show animation)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = await apiRequest('/config', 'POST', { 
      use_encryption: !state.encryptionEnabled 
    });
    
    if (result.success) {
      state.encryptionEnabled = !state.encryptionEnabled;
      
      // Refresh the orderbook to reflect encryption status
      await refreshOrderbook();
      
      // Update config display (which will add/remove encryption indicators)
      updateConfigDisplay();
      
      showNotification(`Encryption ${state.encryptionEnabled ? 'enabled' : 'disabled'} successfully`);
    } else {
      showNotification('Failed to toggle encryption', 'error');
    }
    
    // Remove the transition overlay after a short delay
    setTimeout(() => {
      const overlay = document.querySelector('.encryption-transition-overlay');
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 500);
    
  } catch (error) {
    console.error('Error toggling encryption:', error);
  } finally {
    // Reset button state
    elements.encryptionToggle.disabled = false;
    elements.encryptionToggle.textContent = state.encryptionEnabled ? 'Disable Encryption' : 'Enable Encryption';
  }
}// Initialize the demo when the page is loaded
document.addEventListener('DOMContentLoaded', initDemo);/**
 * demo.js - Core functionality for the Encrypted Orderbook demo
 * Implements UI interaction with the orderbook API
 */

// API endpoint for the orderbook service
const API_URL = 'http://localhost:8080';

// DOM Elements
const elements = {
  // Encryption configuration
  encryptionStatus: document.querySelector('.config-status'),
  encryptionToggle: document.getElementById('toggle-encryption'),
  generateKeysBtn: document.getElementById('generate-keys'),
  
  // Order form elements
  orderTypeSelect: document.getElementById('order-type'),
  limitOrderForm: document.getElementById('order-form'),
  marketOrderForm: document.getElementById('market-order-form'),
  
  // Limit order inputs
  limitPrice: document.getElementById('limit-price'),
  limitQuantity: document.getElementById('limit-quantity'),
  limitSide: document.getElementById('limit-side'),
  limitPubkey: document.getElementById('limit-pubkey'),
  submitLimitBtn: document.getElementById('submit-order'),
  
  // Market order inputs
  marketQuantity: document.getElementById('market-quantity'),
  marketSide: document.getElementById('market-side'),
  marketPubkey: document.getElementById('market-pubkey'),
  submitMarketBtn: document.getElementById('submit-market-order'),
  
  // Display elements
  buyOrdersList: document.getElementById('buy-orders'),
  sellOrdersList: document.getElementById('sell-orders'),
  fillsList: document.getElementById('fills')
};

// State management
let state = {
  encryptionEnabled: false,
  keysGenerated: false,
  orderbook: {
    buyOrders: [],
    sellOrders: []
  },
  fills: []
};

/**
 * API Request Handler
 * Makes requests to the orderbook API
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error with ${endpoint}:`, error);
    showNotification(`API Error: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Initialize Demo
 * Sets up UI and loads initial data
 */
async function initDemo() {
  // Attach event listeners
  attachEventListeners();
  
  // Set up helpful placeholder for public key fields
  if (elements.limitPubkey) {
    elements.limitPubkey.placeholder = "Enter wallet address or click 'Generate Test Key'";
  }
  if (elements.marketPubkey) {
    elements.marketPubkey.placeholder = "Enter wallet address or click 'Generate Test Key'";
  }
  
  // Add generate key buttons next to pubkey inputs
  addPublicKeyHelpers();
  
  // Fetch initial configuration
  try {
    const config = await apiRequest('/config');
    state.encryptionEnabled = config.use_encryption;
    state.keysGenerated = config.keys_generated;
    updateConfigDisplay();
  } catch (error) {
    console.error('Failed to load initial config:', error);
    showNotification('Failed to connect to API', 'error');
  }
  
  // Load initial orderbook
  await refreshOrderbook();
  
  // Load initial fills
  await refreshFills();
}

/**
 * Attach Event Listeners
 * Sets up all UI interaction handlers
 */
function attachEventListeners() {
  // Encryption toggle
  elements.encryptionToggle.addEventListener('click', toggleEncryption);
  
  // Generate keys button
  elements.generateKeysBtn.addEventListener('click', generateKeys);
  
  // Order type selector
  elements.orderTypeSelect?.addEventListener('change', () => {
    const isLimitOrder = elements.orderTypeSelect.value === 'limit';
    elements.limitOrderForm.style.display = isLimitOrder ? 'block' : 'none';
    elements.marketOrderForm.style.display = isLimitOrder ? 'none' : 'block';
  });
  
  // Submit limit order
  elements.submitLimitBtn?.addEventListener('click', submitLimitOrder);
  
  // Submit market order
  elements.submitMarketBtn?.addEventListener('click', submitMarketOrder);
}

/**
 * Add visual indicators for encryption status
 */
function showEncryptionIndicators() {
  // Add encryption indicator style if not already added
  if (!document.getElementById('encryption-styles')) {
    const style = document.createElement('style');
    style.id = 'encryption-styles';
    style.textContent = `
      .order-item.encrypted .order-price::before,
      .order-item.encrypted .order-quantity::before,
      .fill-item.encrypted::before {
        content: "🔒";
        display: inline-block;
        margin-right: 5px;
      }
      
      .order-item.encrypted {
        background-color: rgba(108, 92, 231, 0.1);
        border: 1px solid rgba(108, 92, 231, 0.3);
        position: relative;
      }
      
      .order-item.encrypted .price-value,
      .order-item.encrypted .quantity-value {
        font-family: monospace;
        letter-spacing: 1px;
        position: relative;
      }
      
      .order-item.encrypted .price-value::after,
      .order-item.encrypted .quantity-value::after {
        content: "";
        position: absolute;
        height: 2px;
        background-color: rgba(108, 92, 231, 0.4);
        bottom: 0;
        left: 0;
        width: 100%;
      }
      
      .encryption-badge {
        position: absolute;
        top: -10px;
        right: -10px;
        background: #6c5ce7;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      }
      
      .key-gen-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        border-radius: 8px;
      }
      
      .key-gen-animation {
        text-align: center;
        padding: 20px;
      }
      
      .key-icon {
        font-size: 2rem;
        margin-bottom: 10px;
        animation: pulse 1.5s infinite;
      }
      
      .key-gen-animation.success .key-icon {
        animation: none;
      }
      
      .key-gen-animation.error .key-icon {
        animation: none;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      
      .orderbook-status {
        text-align: center;
        padding: 8px;
        margin-bottom: 15px;
        border-radius: 4px;
        font-weight: bold;
      }
      
      .orderbook-status.encrypted {
        background-color: rgba(108, 92, 231, 0.1);
        color: #6c5ce7;
        border: 1px dashed #6c5ce7;
      }
      
      .orderbook-status.plaintext {
        background-color: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
        border: 1px dashed #2ecc71;
      }
      
      /* Enhanced encryption style for the order display */
      .encryption-enabled .orders-list .order-item:not(.no-orders) {
        font-family: monospace;
        position: relative;
      }
      
      .encryption-enabled .orderbook-columns::before {
        content: "🔒 Orders are encrypted with FHE";
        display: block;
        text-align: center;
        padding: 5px;
        background: rgba(108, 92, 231, 0.1);
        border: 1px dashed #6c5ce7;
        border-radius: 4px;
        margin-bottom: 10px;
        color: #6c5ce7;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add encryption status indicator to orderbook
  const orderbookSection = document.querySelector('.orderbook-section h3');
  if (orderbookSection && !document.querySelector('.orderbook-status')) {
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'orderbook-status encrypted';
    statusIndicator.textContent = '🔒 Orders are encrypted with FHE';
    orderbookSection.after(statusIndicator);
  } else if (document.querySelector('.orderbook-status')) {
    const statusIndicator = document.querySelector('.orderbook-status');
    statusIndicator.className = 'orderbook-status encrypted';
    statusIndicator.textContent = '🔒 Orders are encrypted with FHE';
  }
  
  // Apply encrypted style to order items
  const orderItems = document.querySelectorAll('.order-item:not(.no-orders)');
  orderItems.forEach(item => {
    item.classList.add('encrypted');
    
    // Add encryption badge if not present
    if (!item.querySelector('.encryption-badge')) {
      const badge = document.createElement('div');
      badge.className = 'encryption-badge';
      badge.textContent = '🔒';
      item.appendChild(badge);
    }
    
    // Make price and quantity "look encrypted"
    const priceEl = item.querySelector('.price-value');
    const quantityEl = item.querySelector('.quantity-value');
    
    if (priceEl && !priceEl.dataset.originalValue) {
      priceEl.dataset.originalValue = priceEl.textContent;
      priceEl.textContent = obscureValue(priceEl.textContent);
    }
    
    if (quantityEl && !quantityEl.dataset.originalValue) {
      quantityEl.dataset.originalValue = quantityEl.textContent;
      quantityEl.textContent = obscureValue(quantityEl.textContent);
    }
  });
  
  // Apply encrypted style to fill items
  const fillItems = document.querySelectorAll('.fill-item:not(.no-fills)');
  fillItems.forEach(item => {
    item.classList.add('encrypted');
  });
}

/**
 * Remove visual encryption indicators
 */
function removeEncryptionIndicators() {
  // Update orderbook status indicator
  const statusIndicator = document.querySelector('.orderbook-status');
  if (statusIndicator) {
    statusIndicator.className = 'orderbook-status plaintext';
    statusIndicator.textContent = '🔓 Orders are stored in plaintext';
  }
  
  // Remove encrypted style from order items
  const orderItems = document.querySelectorAll('.order-item.encrypted');
  orderItems.forEach(item => {
    item.classList.remove('encrypted');
    
    // Remove encryption badge if present
    const badge = item.querySelector('.encryption-badge');
    if (badge) {
      item.removeChild(badge);
    }
    
    // Restore original price and quantity values
    const priceEl = item.querySelector('.price-value');
    const quantityEl = item.querySelector('.quantity-value');
    
    if (priceEl && priceEl.dataset.originalValue) {
      priceEl.textContent = priceEl.dataset.originalValue;
      delete priceEl.dataset.originalValue;
    }
    
    if (quantityEl && quantityEl.dataset.originalValue) {
      quantityEl.textContent = quantityEl.dataset.originalValue;
      delete quantityEl.dataset.originalValue;
    }
  });
  
  // Remove encrypted style from fill items
  const fillItems = document.querySelectorAll('.fill-item.encrypted');
  fillItems.forEach(item => {
    item.classList.remove('encrypted');
  });
}

/**
 * Make a value look "encrypted" for display purposes
 */
function obscureValue(value) {
  // For demo purposes, we'll just replace the actual value with some encrypted-looking text
  // In reality, FHE would keep the actual value truly encrypted
  if (!value) return '';
  
  // Create a pattern that looks like encrypted data
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return result;
}

/**
 * Generate FHE Keys
 * Generates new FHE keys for encrypted operations
 */
async function generateKeys() {
  try {
    // Show loading state
    elements.generateKeysBtn.disabled = true;
    elements.generateKeysBtn.textContent = 'Generating...';
    
    // Add visual key generation effect
    const configPanel = document.querySelector('.config-panel');
    const keyGenOverlay = document.createElement('div');
    keyGenOverlay.className = 'key-gen-overlay';
    keyGenOverlay.innerHTML = `
      <div class="key-gen-animation">
        <div class="key-icon">🔑</div>
        <div class="key-gen-progress">Generating FHE Key Pair...</div>
      </div>
    `;
    configPanel.appendChild(keyGenOverlay);
    
    // Send request to generate keys (with slight delay to show animation)
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = await apiRequest('/generate-keys', 'POST');
    
    if (result.success) {
      state.keysGenerated = true;
      updateConfigDisplay();
      showNotification('FHE keys generated successfully');
      
      // Show key success animation
      keyGenOverlay.innerHTML = `
        <div class="key-gen-animation success">
          <div class="key-icon">✅</div>
          <div class="key-gen-progress">FHE Keys Generated!</div>
        </div>
      `;
      
      // Enable encryption toggle
      elements.encryptionToggle.disabled = false;
      
      // Remove overlay after a short delay
      setTimeout(() => {
        configPanel.removeChild(keyGenOverlay);
      }, 1500);
    } else {
      keyGenOverlay.innerHTML = `
        <div class="key-gen-animation error">
          <div class="key-icon">❌</div>
          <div class="key-gen-progress">Key Generation Failed</div>
        </div>
      `;
      setTimeout(() => {
        configPanel.removeChild(keyGenOverlay);
      }, 1500);
      showNotification('Failed to generate keys', 'error');
    }
  } catch (error) {
    console.error('Error generating keys:', error);
  } finally {
    // Reset button state
    elements.generateKeysBtn.disabled = state.keysGenerated;
    elements.generateKeysBtn.textContent = 'Generate FHE Keys';
  }
}

/**
 * Submit Limit Order
 * Places a new limit order on the orderbook
 */
async function submitLimitOrder() {
  // Validate inputs
  const price = parseFloat(elements.limitPrice.value);
  const quantity = parseFloat(elements.limitQuantity.value);
  const side = elements.limitSide.value;
  const userPubkey = elements.limitPubkey.value;
  
  if (!price || isNaN(price) || price <= 0) {
    showNotification('Please enter a valid price', 'error');
    return;
  }
  
  if (!quantity || isNaN(quantity) || quantity <= 0) {
    showNotification('Please enter a valid quantity', 'error');
    return;
  }
  
  if (!userPubkey) {
    showNotification('Please enter your public key', 'error');
    return;
  }
  
  try {
    // Show loading state
    elements.submitLimitBtn.disabled = true;
    elements.submitLimitBtn.textContent = 'Placing Order...';
    
    // Construct order data
    const orderData = {
      price,
      quantity,
      side,
      user_pubkey: userPubkey
    };
    
    // Send order to API
    const result = await apiRequest('/orders', 'POST', orderData);
    
    if (result.success) {
      showNotification(`Successfully placed ${side} limit order`);
      clearOrderForm('limit');
      await refreshOrderbook();
    } else {
      showNotification('Failed to place limit order', 'error');
    }
  } catch (error) {
    console.error('Error placing limit order:', error);
  } finally {
    // Reset button state
    elements.submitLimitBtn.disabled = false;
    elements.submitLimitBtn.textContent = 'Place Limit Order';
  }
}

/**
 * Submit Market Order
 * Places a new market order on the orderbook
 */
async function submitMarketOrder() {
  // Validate inputs
  const quantity = parseFloat(elements.marketQuantity.value);
  const side = elements.marketSide.value;
  const userPubkey = elements.marketPubkey.value;
  
  if (!quantity || isNaN(quantity) || quantity <= 0) {
    showNotification('Please enter a valid quantity', 'error');
    return;
  }
  
  if (!userPubkey) {
    showNotification('Please enter your public key', 'error');
    return;
  }
  
  try {
    // Show loading state
    elements.submitMarketBtn.disabled = true;
    elements.submitMarketBtn.textContent = 'Placing Order...';
    
    // Construct order data
    const orderData = {
      quantity,
      user_pubkey: userPubkey
    };
    
    // Determine endpoint based on side
    const endpoint = side === 'buy' ? '/market-buy' : '/market-sell';
    
    // Send order to API
    const result = await apiRequest(endpoint, 'POST', orderData);
    
    if (result.success) {
      showNotification(`Successfully placed market ${side} order`);
      clearOrderForm('market');
      await refreshOrderbook();
      await refreshFills();
    } else {
      showNotification('Failed to place market order', 'error');
    }
  } catch (error) {
    console.error('Error placing market order:', error);
  } finally {
    // Reset button state
    elements.submitMarketBtn.disabled = false;
    elements.submitMarketBtn.textContent = 'Place Market Order';
  }
}

/**
 * Refresh Orderbook
 * Fetches and displays the latest orderbook state
 */
async function refreshOrderbook() {
  try {
    const orderbook = await apiRequest('/orders');
    state.orderbook.buyOrders = orderbook[0] || [];
    state.orderbook.sellOrders = orderbook[1] || [];
    renderOrderbook();
  } catch (error) {
    console.error('Error refreshing orderbook:', error);
  }
}

/**
 * Refresh Fills
 * Fetches and displays the latest order fills
 */
async function refreshFills() {
  try {
    state.fills = await apiRequest('/fills');
    renderFills();
  } catch (error) {
    console.error('Error refreshing fills:', error);
  }
}

/**
 * Update Config Display
 * Updates the UI to reflect current config state
 */
function updateConfigDisplay() {
  // Update encryption status text
  const encryptionStatusElem = document.querySelector('.config-status');
  if (encryptionStatusElem) {
    encryptionStatusElem.innerHTML = `
      <div>
        <div>Encryption: <span class="${state.encryptionEnabled ? 'enabled' : 'disabled'}">${state.encryptionEnabled ? 'Enabled' : 'Disabled'}</span></div>
        <div>FHE Keys: <span class="${state.keysGenerated ? 'enabled' : 'disabled'}">${state.keysGenerated ? 'Generated' : 'Not Generated'}</span></div>
      </div>
    `;
  }
  
  // Update button text
  if (elements.encryptionToggle) {
    elements.encryptionToggle.textContent = state.encryptionEnabled ? 'Disable Encryption' : 'Enable Encryption';
    // Disable encryption toggle if keys aren't generated
    elements.encryptionToggle.disabled = !state.keysGenerated && !state.encryptionEnabled;
    if (!state.keysGenerated && !state.encryptionEnabled) {
      elements.encryptionToggle.title = "Generate FHE keys first before enabling encryption";
    } else {
      elements.encryptionToggle.title = "";
    }
  }
  
  // Disable generate keys button if keys are already generated
  if (elements.generateKeysBtn) {
    elements.generateKeysBtn.disabled = state.keysGenerated;
  }
  
  // Show encryption status across UI
  document.body.classList.toggle('encryption-enabled', state.encryptionEnabled);
  
  // Add visual indicator for encryption status to orderbook
  if (state.encryptionEnabled) {
    showEncryptionIndicators();
  } else {
    removeEncryptionIndicators();
  }
}

/**
 * Render Orderbook
 * Updates the UI with current orderbook data
 */
function renderOrderbook() {
  // Sort buy orders by price (descending)
  const sortedBuyOrders = [...state.orderbook.buyOrders].sort((a, b) => b.price - a.price);
  
  // Sort sell orders by price (ascending)
  const sortedSellOrders = [...state.orderbook.sellOrders].sort((a, b) => a.price - b.price);
  
  // Render buy orders
  if (elements.buyOrdersList) {
    if (sortedBuyOrders.length > 0) {
      elements.buyOrdersList.innerHTML = sortedBuyOrders.map(order => `
        <div class="order-item ${state.encryptionEnabled ? 'encrypted' : ''}">
          <div class="order-price">
            <span>Price: </span>
            <span class="price-value">${order.price}</span>
          </div>
          <div class="order-quantity">
            <span>Quantity: </span>
            <span class="quantity-value">${order.quantity}</span>
          </div>
          <div class="order-user">
            <span>User: </span>
            <span class="user-value">${truncateString(order.user_pubkey, 8)}</span>
          </div>
          ${state.encryptionEnabled ? '<div class="encryption-badge">🔒</div>' : ''}
        </div>
      `).join('');
      
      // If encryption is enabled, apply the "encrypted" visual effect
      if (state.encryptionEnabled) {
        setTimeout(() => {
          const priceElements = elements.buyOrdersList.querySelectorAll('.price-value');
          const quantityElements = elements.buyOrdersList.querySelectorAll('.quantity-value');
          
          priceElements.forEach(el => {
            el.dataset.originalValue = el.textContent;
            el.textContent = obscureValue(el.textContent);
          });
          
          quantityElements.forEach(el => {
            el.dataset.originalValue = el.textContent;
            el.textContent = obscureValue(el.textContent);
          });
        }, 100);
      }
    } else {
      elements.buyOrdersList.innerHTML = '<div class="no-orders">No buy orders</div>';
    }
  }
  
  // Render sell orders
  if (elements.sellOrdersList) {
    if (sortedSellOrders.length > 0) {
      elements.sellOrdersList.innerHTML = sortedSellOrders.map(order => `
        <div class="order-item ${state.encryptionEnabled ? 'encrypted' : ''}">
          <div class="order-price">
            <span>Price: </span>
            <span class="price-value">${order.price}</span>
          </div>
          <div class="order-quantity">
            <span>Quantity: </span>
            <span class="quantity-value">${order.quantity}</span>
          </div>
          <div class="order-user">
            <span>User: </span>
            <span class="user-value">${truncateString(order.user_pubkey, 8)}</span>
          </div>
          ${state.encryptionEnabled ? '<div class="encryption-badge">🔒</div>' : ''}
        </div>
      `).join('');
      
      // If encryption is enabled, apply the "encrypted" visual effect
      if (state.encryptionEnabled) {
        setTimeout(() => {
          const priceElements = elements.sellOrdersList.querySelectorAll('.price-value');
          const quantityElements = elements.sellOrdersList.querySelectorAll('.quantity-value');
          
          priceElements.forEach(el => {
            el.dataset.originalValue = el.textContent;
            el.textContent = obscureValue(el.textContent);
          });
          
          quantityElements.forEach(el => {
            el.dataset.originalValue = el.textContent;
            el.textContent = obscureValue(el.textContent);
          });
        }, 100);
      }
    } else {
      elements.sellOrdersList.innerHTML = '<div class="no-orders">No sell orders</div>';
    }
  }
  
  // Update encryption indicators
  if (state.encryptionEnabled) {
    showEncryptionIndicators();
  } else {
    removeEncryptionIndicators();
  }
}

/**
 * Render Fills
 * Updates the UI with current fill data
 */
function renderFills() {
  if (!elements.fillsList) return;
  
  if (state.fills.length > 0) {
    elements.fillsList.innerHTML = state.fills.map(fill => `
      <div class="fill-item ${state.encryptionEnabled ? 'encrypted' : ''}">
        <div class="fill-price">
          <span>Price: </span>
          <span class="price-value">${fill.price}</span>
        </div>
        <div class="fill-quantity">
          <span>Quantity: </span>
          <span class="quantity-value">${fill.quantity}</span>
        </div>
        <div class="fill-time">
          <span>Time: </span>
          <span class="time-value">${formatTimestamp(fill.timestamp)}</span>
        </div>
        ${state.encryptionEnabled ? '<div class="encryption-badge">🔒</div>' : ''}
      </div>
    `).join('');
    
    // If encryption is enabled, apply the "encrypted" visual effect
    if (state.encryptionEnabled) {
      setTimeout(() => {
        const priceElements = elements.fillsList.querySelectorAll('.price-value');
        const quantityElements = elements.fillsList.querySelectorAll('.quantity-value');
        
        priceElements.forEach(el => {
          el.dataset.originalValue = el.textContent;
          el.textContent = obscureValue(el.textContent);
        });
        
        quantityElements.forEach(el => {
          el.dataset.originalValue = el.textContent;
          el.textContent = obscureValue(el.textContent);
        });
      }, 100);
    }
  } else {
    elements.fillsList.innerHTML = '<div class="no-fills">No fills yet</div>';
  }
}

/**
 * Clear Order Form
 * Resets input fields in the order form
 */
function clearOrderForm(type) {
  if (type === 'limit') {
    elements.limitPrice.value = '';
    elements.limitQuantity.value = '';
    elements.limitPubkey.value = '';
  } else if (type === 'market') {
    elements.marketQuantity.value = '';
    elements.marketPubkey.value = '';
  }
}

/**
 * Show Notification
 * Displays a temporary notification message
 */
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Auto-remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Helper function to truncate long strings (e.g. public keys)
function truncateString(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// Helper function to format timestamps
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Add Public Key Helpers
 * Adds UI elements to help with public key generation
 */
function addPublicKeyHelpers() {
  // Add helper button for limit order form
  if (elements.limitPubkey) {
    const limitKeyContainer = elements.limitPubkey.parentElement;
    const limitKeyButton = document.createElement('button');
    limitKeyButton.type = 'button';
    limitKeyButton.className = 'generate-key-btn';
    limitKeyButton.textContent = 'Generate Test Key';
    limitKeyButton.onclick = () => generateTestPublicKey('limit');
    limitKeyContainer.appendChild(limitKeyButton);
  }
  
  // Add helper button for market order form
  if (elements.marketPubkey) {
    const marketKeyContainer = elements.marketPubkey.parentElement;
    const marketKeyButton = document.createElement('button');
    marketKeyButton.type = 'button';
    marketKeyButton.className = 'generate-key-btn';
    marketKeyButton.textContent = 'Generate Test Key';
    marketKeyButton.onclick = () => generateTestPublicKey('market');
    marketKeyContainer.appendChild(marketKeyButton);
  }
  
  // Add some CSS for the buttons
  const style = document.createElement('style');
  style.textContent = `
    .generate-key-btn {
      margin-left: 8px;
      padding: 4px 8px;
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .generate-key-btn:hover {
      background: #5d4bd1;
    }
    .form-group {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Generate Test Public Key
 * Creates a random test public key for demo purposes
 */
function generateTestPublicKey(formType) {
  // Generate a random string resembling a Solana wallet address
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Generate a 32-character string
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Add a Solana-like prefix
  const publicKey = 'demo' + result;
  
  // Set the value in the appropriate input field
  if (formType === 'limit' && elements.limitPubkey) {
    elements.limitPubkey.value = publicKey;
  } else if (formType === 'market' && elements.marketPubkey) {
    elements.marketPubkey.value = publicKey;
  }
  
  // Show a notification
  showNotification('Test public key generated!');
  
  return publicKey;
}
