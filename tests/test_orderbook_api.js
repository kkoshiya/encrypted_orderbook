/**
 * Comprehensive test script for the Encrypted Orderbook API
 * 
 * This script tests all the functionality of the orderbook API, including:
 * - Configuration management
 * - FHE key generation
 * - Placing limit orders (both encrypted and plaintext)
 * - Placing market orders
 * - Order matching
 * - Retrieving orderbook state and fills
 */

const fetch = require('node-fetch');
const API_URL = 'http://localhost:8080';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error(`Error making request to ${endpoint}:`, error);
        throw error;
    }
}

// Helper function to log test results
function logTest(testName, success, details = null) {
    const status = success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${testName}`);
    if (details) {
        console.log('  Details:', typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
    }
}

// Helper function to wait for a specified time
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test suite
async function runTests() {
    console.log('🔍 STARTING ENCRYPTED ORDERBOOK API TESTS 🔍');
    console.log('===========================================');

    try {
        // Reset the orderbook state before starting tests
        console.log('\n📋 Resetting orderbook state');
        const resetResult = await apiRequest('/reset', 'POST');
        logTest('Reset orderbook', resetResult.success, resetResult);
    } catch (error) {
        console.error('❌ Failed to reset orderbook:', error);
    }

    try {
        // Test 1: Check current configuration
        console.log('\n📋 Test 1: Checking current configuration');
        const config = await apiRequest('/config');
        logTest('Get current configuration', true, config);

        // Test 2: Generate FHE keys (if not already generated)
        console.log('\n📋 Test 2: Generating FHE keys');
        const keysResult = await apiRequest('/generate-keys', 'POST');
        logTest('Generate FHE keys', keysResult.success, keysResult);

        // Test 3: Enable encryption (if not already enabled)
        console.log('\n📋 Test 3: Enabling encryption');
        if (!config.use_encryption) {
            const enableResult = await apiRequest('/config', 'POST', { use_encryption: true });
            logTest('Enable encryption', enableResult.success, enableResult);
        } else {
            logTest('Enable encryption', true, 'Encryption already enabled');
        }

        // Test 4: Place a limit sell order
        console.log('\n📋 Test 4: Placing a limit sell order');
        const sellOrderData = {
            price: 100,
            quantity: 5,
            side: 'sell',
            user_pubkey: 'test_seller'
        };
        const sellOrderResult = await apiRequest('/orders', 'POST', sellOrderData);
        logTest('Place limit sell order', sellOrderResult.success, sellOrderResult);

        // Test 5: Place a limit buy order
        console.log('\n📋 Test 5: Placing a limit buy order');
        const buyOrderData = {
            price: 95,
            quantity: 3,
            side: 'buy',
            user_pubkey: 'test_buyer'
        };
        const buyOrderResult = await apiRequest('/orders', 'POST', buyOrderData);
        logTest('Place limit buy order', buyOrderResult.success, buyOrderResult);

        // Test 6: Get current orderbook state
        console.log('\n📋 Test 6: Getting current orderbook state');
        const orderbook = await apiRequest('/orders');
        const [buyOrders, sellOrders] = orderbook;
        logTest('Get orderbook state', true, { 
            buyOrdersCount: buyOrders.length, 
            sellOrdersCount: sellOrders.length 
        });

        // Test 7: Place a market buy order
        console.log('\n📋 Test 7: Placing a market buy order');
        const marketBuyData = {
            quantity: 2,
            user_pubkey: 'test_market_buyer'
        };
        const marketBuyResult = await apiRequest('/market-buy', 'POST', marketBuyData);
        logTest('Place market buy order', marketBuyResult.success, marketBuyResult);

        // Test 8: Place a market sell order
        console.log('\n📋 Test 8: Placing a market sell order');
        const marketSellData = {
            quantity: 2,
            user_pubkey: 'test_market_seller'
        };
        const marketSellResult = await apiRequest('/market-sell', 'POST', marketSellData);
        logTest('Place market sell order', marketSellResult.success, marketSellResult);

        // Test 9: Get fills
        console.log('\n📋 Test 9: Getting fills');
        const fills = await apiRequest('/fills');
        logTest('Get fills', fills.length > 0, { fillsCount: fills.length, fills });

        // Test 10: Disable encryption
        console.log('\n📋 Test 10: Disabling encryption');
        const disableResult = await apiRequest('/config', 'POST', { use_encryption: false });
        logTest('Disable encryption', disableResult.success, disableResult);

        // Test 11: Place orders with encryption disabled
        console.log('\n📋 Test 11: Placing orders with encryption disabled');
        const plainSellResult = await apiRequest('/orders', 'POST', {
            price: 110,
            quantity: 5,
            side: 'sell',
            user_pubkey: 'test_plain_seller'
        });
        const plainBuyResult = await apiRequest('/orders', 'POST', {
            price: 105,
            quantity: 3,
            side: 'buy',
            user_pubkey: 'test_plain_buyer'
        });
        logTest('Place plaintext orders', 
            plainSellResult.success && plainBuyResult.success, 
            { sellOrder: plainSellResult, buyOrder: plainBuyResult }
        );

        // Test 12: Re-enable encryption
        console.log('\n📋 Test 12: Re-enabling encryption');
        const reEnableResult = await apiRequest('/config', 'POST', { use_encryption: true });
        logTest('Re-enable encryption', reEnableResult.success, reEnableResult);

        console.log('\n✨ ALL TESTS COMPLETED ✨');
        console.log('=========================');
        
        // Final orderbook state
        const finalOrderbook = await apiRequest('/orders');
        const finalFills = await apiRequest('/fills');
        console.log('\n📊 FINAL ORDERBOOK STATE:');
        console.log('Buy Orders:', finalOrderbook[0].length);
        console.log('Sell Orders:', finalOrderbook[1].length);
        console.log('Fills:', finalFills.length);

    } catch (error) {
        console.error('❌ TEST SUITE FAILED:', error);
    }
}

// Run the tests
console.log('Starting test suite...');
runTests().catch(console.error);
