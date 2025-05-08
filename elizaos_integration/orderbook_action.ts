import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from 'elizaos';
import axios from 'axios';

// Define the orderbook action for ElizaOS
const orderBookAction: Action = {
  name: 'ENCRYPTED_ORDERBOOK',
  similes: ['PLACE_ORDER', 'VIEW_ORDERS', 'TRADE', 'FHE_ORDERBOOK'],
  description: 'Interact with an encrypted orderbook using Fully Homomorphic Encryption (FHE) on Solana. This action allows placing buy/sell orders and viewing the current orderbook state while maintaining privacy through encryption.',
  
  // Validate if this action should be available based on the message
  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if the message contains orderbook-related keywords
    const messageText = message.content?.text?.toLowerCase() || '';
    
    const orderKeywords = [
      'order', 'buy', 'sell', 'trade', 'orderbook', 
      'price', 'quantity', 'fhe', 'encrypted', 'solana'
    ];
    
    return orderKeywords.some(keyword => messageText.includes(keyword));
  },
  
  // Handle the action execution
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ) => {
    const messageText = message.content?.text?.toLowerCase() || '';
    let responseContent: Content;
    
    try {
      // Check if the user wants to view orders
      if (messageText.includes('view') || messageText.includes('show') || messageText.includes('get')) {
        const orders = await getOrders();
        
        responseContent = {
          thought: 'The user wants to see the current orderbook. I should fetch and display the current buy and sell orders.',
          text: formatOrderbookResponse(orders),
          actions: ['ENCRYPTED_ORDERBOOK'],
        };
      } 
      // Check if the user wants to place an order
      else if (messageText.includes('place') || messageText.includes('add') || messageText.includes('create') || 
               messageText.includes('buy') || messageText.includes('sell')) {
        
        // Extract order details from message
        const orderDetails = extractOrderDetails(messageText);
        
        if (!orderDetails) {
          responseContent = {
            thought: 'The user wants to place an order but did not provide all the necessary details.',
            text: 'To place an order, I need the following information:\n- Side (buy or sell)\n- Price\n- Quantity\n- Your Solana public key\n\nFor example: "Buy 5 units at price 100 with my public key abc123"',
            actions: ['ENCRYPTED_ORDERBOOK'],
          };
        } else {
          const result = await placeOrder(orderDetails);
          
          responseContent = {
            thought: `The user wants to place a ${orderDetails.side} order for ${orderDetails.quantity} units at price ${orderDetails.price}. Submitting to the orderbook.`,
            text: `✅ Successfully placed your ${orderDetails.side} order!\n\nOrder ID: ${result.id}\nPrice: ${orderDetails.price}\nQuantity: ${orderDetails.quantity}\n\nYour order has been encrypted and added to the orderbook.`,
            actions: ['ENCRYPTED_ORDERBOOK'],
          };
        }
      } else {
        // General information about the orderbook
        responseContent = {
          thought: 'The user is asking about the orderbook but not specifically to view orders or place an order. I should provide general information.',
          text: 'I can help you interact with the Encrypted Orderbook for Solana. This orderbook uses Fully Homomorphic Encryption (FHE) to keep your order information private while still allowing for order matching.\n\nWhat would you like to do?\n- View current orders in the orderbook\n- Place a buy or sell order',
          actions: ['ENCRYPTED_ORDERBOOK'],
        };
      }
    } catch (error) {
      console.error('Error in orderbook action:', error);
      responseContent = {
        thought: 'There was an error interacting with the orderbook service.',
        text: 'I encountered an issue while trying to interact with the orderbook. The service might be unavailable or there was an error processing your request. Please try again later.',
        actions: ['ENCRYPTED_ORDERBOOK'],
      };
    }
    
    // Send the response
    if (callback) {
      await callback(responseContent);
    }
    
    return true;
  },
  
  // Example interactions with this action
  examples: [
    [
      {
        name: '{{user1}}',
        content: { text: 'Show me the current orderbook' },
      },
      {
        name: '{{agent}}',
        content: {
          text: 'Here are the current orders in the encrypted orderbook:\n\nBuy Orders:\n- Price: 105, Quantity: 10\n- Price: 102, Quantity: 5\n\nSell Orders:\n- Price: 110, Quantity: 8\n- Price: 115, Quantity: 12',
          thought: 'The user wants to see the current orderbook. I should fetch and display the current buy and sell orders.',
          actions: ['ENCRYPTED_ORDERBOOK'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: { text: 'I want to place a buy order for 5 units at price 100 with my public key abc123' },
      },
      {
        name: '{{agent}}',
        content: {
          text: '✅ Successfully placed your buy order!\n\nOrder ID: 12345\nPrice: 100\nQuantity: 5\n\nYour order has been encrypted and added to the orderbook.',
          thought: 'The user wants to place a buy order for 5 units at price 100. Submitting to the orderbook.',
          actions: ['ENCRYPTED_ORDERBOOK'],
        },
      },
    ],
  ],
};

// Helper functions

// Function to get all orders from the orderbook
async function getOrders() {
  try {
    const response = await axios.get('http://localhost:3000/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Function to place an order in the orderbook
async function placeOrder(orderDetails: {
  side: string;
  price: number;
  quantity: number;
  user_pubkey: string;
}) {
  try {
    const response = await axios.post('http://localhost:3000/orders', orderDetails);
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
}

// Function to extract order details from a message
function extractOrderDetails(message: string) {
  // Simple regex-based extraction - in a real implementation, you'd use more robust NLP
  let side: string | null = null;
  if (message.includes('buy')) side = 'buy';
  if (message.includes('sell')) side = 'sell';
  
  // Extract price
  const priceMatch = message.match(/price\s+(\d+)/i) || message.match(/at\s+(\d+)/i);
  const price = priceMatch ? parseInt(priceMatch[1]) : null;
  
  // Extract quantity
  const quantityMatch = message.match(/(\d+)\s+units?/i) || message.match(/quantity\s+(\d+)/i);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;
  
  // Extract public key
  const pubkeyMatch = message.match(/key\s+([a-zA-Z0-9]+)/i);
  const user_pubkey = pubkeyMatch ? pubkeyMatch[1] : null;
  
  // Return null if any required field is missing
  if (!side || !price || !quantity || !user_pubkey) {
    return null;
  }
  
  return {
    side,
    price,
    quantity,
    user_pubkey
  };
}

// Function to format orderbook response
function formatOrderbookResponse([buyOrders, sellOrders]: [any[], any[]]) {
  let response = 'Here are the current orders in the encrypted orderbook:\n\n';
  
  response += 'Buy Orders:\n';
  if (buyOrders.length === 0) {
    response += '- No buy orders currently\n';
  } else {
    buyOrders.forEach((order) => {
      response += `- Price: ${order.price}, Quantity: ${order.quantity}\n`;
    });
  }
  
  response += '\nSell Orders:\n';
  if (sellOrders.length === 0) {
    response += '- No sell orders currently\n';
  } else {
    sellOrders.forEach((order) => {
      response += `- Price: ${order.price}, Quantity: ${order.quantity}\n`;
    });
  }
  
  return response;
}

export default orderBookAction;
