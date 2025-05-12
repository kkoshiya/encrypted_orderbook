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
 * Action to reset the orderbook
 */
export const resetOrderbookAction: Action = {
  name: 'RESET_ORDERBOOK',
  similes: ['CLEAR_ORDERBOOK', 'RESET_ALL', 'START_FRESH'],
  description: 'Resets the encrypted orderbook, clearing all orders and fills',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('reset orderbook') ||
      text.includes('clear orderbook') ||
      text.includes('reset all orders') ||
      text.includes('start fresh')
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
      logger.info('Handling RESET_ORDERBOOK action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Reset the orderbook
      const result = await orderbookService.resetOrderbook();
      
      // Create response content
      const responseContent: Content = {
        thought: 'The user wants to reset the orderbook. I will clear all orders and fills.',
        text: `I've reset the orderbook. All orders and fills have been cleared.\nResult: ${JSON.stringify(result)}`,
        actions: ['RESET_ORDERBOOK'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in RESET_ORDERBOOK action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error resetting the orderbook.',
        text: `I'm sorry, I couldn't reset the orderbook. Error: ${error.message}`,
        actions: ['RESET_ORDERBOOK'],
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
          text: 'Reset the orderbook',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "I've reset the orderbook. All orders and fills have been cleared.",
          actions: ['RESET_ORDERBOOK'],
        },
      },
    ],
  ],
};
