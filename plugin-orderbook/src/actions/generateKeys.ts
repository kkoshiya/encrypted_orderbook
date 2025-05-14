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
 * Action to generate FHE keys for the orderbook
 */
export const generateKeysAction: Action = {
  name: 'GENERATE_KEYS',
  similes: ['CREATE_KEYS', 'SETUP_FHE', 'INITIALIZE_KEYS'],
  description: 'Generates FHE keys for the encrypted orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('generate keys') ||
      text.includes('create keys') ||
      text.includes('setup fhe') ||
      text.includes('initialize keys')
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
      logger.info('Handling GENERATE_KEYS action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Generate keys
      const result = await orderbookService.generateKeys();
      
      // Create response content
      const responseContent: Content = {
        thought: 'The user wants to generate FHE keys for the orderbook. I will initiate the key generation process.',
        text: `I've generated FHE keys for the orderbook.\nResult: ${JSON.stringify(result)}`,
        actions: ['GENERATE_KEYS'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in GENERATE_KEYS action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error generating FHE keys.',
        text: `I'm sorry, I couldn't generate the FHE keys. Error: ${error.message}`,
        actions: ['GENERATE_KEYS'],
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
          text: 'Generate FHE keys for the orderbook',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "I've generated FHE keys for the orderbook.",
          actions: ['GENERATE_KEYS'],
        },
      },
    ],
  ],
};
