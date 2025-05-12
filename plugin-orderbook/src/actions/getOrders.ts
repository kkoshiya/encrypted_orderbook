import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { OrderbookService } from '../service';

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
