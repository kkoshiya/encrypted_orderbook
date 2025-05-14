import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { OrderbookService } from './service';

/**
 * Action to get all orders from the orderbook
 */
export const getOrdersAction: Action = {
  name: 'GET_ORDERS',
  similes: ['FETCH_ORDERS', 'LIST_ORDERS', 'VIEW_ORDERBOOK'],
  description: 'Fetches all orders from the encrypted orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('get orders') ||
      text.includes('show orders') ||
      text.includes('list orders') ||
      text.includes('view orderbook') ||
      text.includes('see orders')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling GET_ORDERS action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Fetch orders from the service
      const orders = await orderbookService.getOrders();

      // Format orders for display
      const formattedOrders = JSON.stringify(orders, null, 2);
      
      // Create response content
      const responseContent: Content = {
        thought: 'The user wants to see the current orders in the orderbook. I will fetch them and display them in a readable format.',
        text: `Here are the current orders in the orderbook:\n\`\`\`json\n${formattedOrders}\n\`\`\``,
        actions: ['GET_ORDERS'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in GET_ORDERS action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error fetching the orders from the orderbook.',
        text: `I'm sorry, I couldn't fetch the orders from the orderbook. Error: ${error.message}`,
        actions: ['GET_ORDERS'],
        source: message.content.source,
      };
      
      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Show me the current orders in the orderbook',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Here are the current orders in the orderbook: [orders data]',
          actions: ['GET_ORDERS'],
        },
      },
    ],
  ],
};

/**
 * Action to add a new limit order to the orderbook
 */
export const addOrderAction: Action = {
  name: 'ADD_ORDER',
  similes: ['PLACE_ORDER', 'CREATE_ORDER', 'NEW_ORDER'],
  description: 'Adds a new limit order to the encrypted orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('add order') ||
      text.includes('place order') ||
      text.includes('create order') ||
      text.includes('new order') ||
      text.includes('limit order')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling ADD_ORDER action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Parse the order details from the message
      const text = message.content.text.toLowerCase();
      
      // Simple parsing logic - this could be improved with NLP
      const isBuy = !text.includes('sell');
      const side = isBuy ? 'buy' : 'sell';
      
      // Extract price and amount using regex
      const priceMatch = text.match(/price[:\s]+(\d+(\.\d+)?)/i) || 
                        text.match(/at[:\s]+(\d+(\.\d+)?)/i) ||
                        text.match(/(\d+(\.\d+)?)[:\s]+price/i);
      
      const amountMatch = text.match(/amount[:\s]+(\d+(\.\d+)?)/i) || 
                          text.match(/(\d+(\.\d+)?)[:\s]+amount/i) ||
                          text.match(/buy[:\s]+(\d+(\.\d+)?)/i) ||
                          text.match(/sell[:\s]+(\d+(\.\d+)?)/i);
      
      if (!priceMatch || !amountMatch) {
        const errorContent: Content = {
          thought: 'The user wants to add an order but did not provide all the required details (price and amount).',
          text: "I need both the price and amount to place an order. Please specify them like 'add buy order at price 100 amount 5'.",
          actions: ['ADD_ORDER'],
          source: message.content.source,
        };
        
        await callback(errorContent);
        return errorContent;
      }
      
      const price = parseFloat(priceMatch[1]);
      const amount = parseFloat(amountMatch[1]);
      
      // Add the order
      const result = await orderbookService.addOrder({ side, price, amount });
      
      // Create response content
      const responseContent: Content = {
        thought: `The user wants to place a ${side} order at price ${price} with amount ${amount}. I will add this to the orderbook.`,
        text: `I've added your ${side} order: ${amount} @ ${price}\nResult: ${JSON.stringify(result)}`,
        actions: ['ADD_ORDER'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in ADD_ORDER action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error adding the order to the orderbook.',
        text: `I'm sorry, I couldn't add the order to the orderbook. Error: ${error.message}`,
        actions: ['ADD_ORDER'],
        source: message.content.source,
      };
      
      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Add a buy order at price 100 with amount 5',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "I've added your buy order: 5 @ 100",
          actions: ['ADD_ORDER'],
        },
      },
    ],
  ],
};
