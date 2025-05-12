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
 * Action to get all fills from the orderbook
 */
export const getFillsAction: Action = {
  name: 'GET_FILLS',
  similes: ['FETCH_FILLS', 'LIST_FILLS', 'VIEW_FILLS'],
  description: 'Fetches all fills from the encrypted orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('get fills') ||
      text.includes('show fills') ||
      text.includes('list fills') ||
      text.includes('view fills') ||
      text.includes('see fills')
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
      logger.info('Handling GET_FILLS action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Fetch fills from the service
      const fills = await orderbookService.getFills();

      // Format fills for display
      const formattedFills = JSON.stringify(fills, null, 2);
      
      // Create response content
      const responseContent: Content = {
        thought: 'The user wants to see the fills in the orderbook. I will fetch them and display them in a readable format.',
        text: `Here are the fills in the orderbook:\n\`\`\`json\n${formattedFills}\n\`\`\``,
        actions: ['GET_FILLS'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in GET_FILLS action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error fetching the fills from the orderbook.',
        text: `I'm sorry, I couldn't fetch the fills from the orderbook. Error: ${error.message}`,
        actions: ['GET_FILLS'],
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
          text: 'Show me the fills in the orderbook',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Here are the fills in the orderbook: [fills data]',
          actions: ['GET_FILLS'],
        },
      },
    ],
  ],
};
