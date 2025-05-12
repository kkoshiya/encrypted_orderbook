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
 * Action to execute a market buy order
 */
export const marketBuyAction: Action = {
  name: 'MARKET_BUY',
  similes: ['BUY_MARKET', 'EXECUTE_BUY', 'BUY_NOW'],
  description: 'Executes a market buy order on the orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('market buy') ||
      text.includes('buy at market') ||
      text.includes('buy now') ||
      (text.includes('buy') && !text.includes('limit'))
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
      logger.info('Handling MARKET_BUY action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Parse the amount from the message
      const text = message.content.text.toLowerCase();
      
      // Extract amount using regex
      const amountMatch = text.match(/amount[:\s]+(\d+(\.\d+)?)/i) || 
                          text.match(/(\d+(\.\d+)?)[:\s]+amount/i) ||
                          text.match(/buy[:\s]+(\d+(\.\d+)?)/i);
      
      if (!amountMatch) {
        const errorContent: Content = {
          thought: 'The user wants to execute a market buy but did not provide the amount.',
          text: "I need the amount to execute a market buy. Please specify it like 'market buy amount 5'.",
          actions: ['MARKET_BUY'],
          source: message.content.source,
        };
        
        await callback(errorContent);
        return errorContent;
      }
      
      const amount = parseFloat(amountMatch[1]);
      
      // Execute the market buy
      const result = await orderbookService.marketBuy(amount);
      
      // Create response content
      const responseContent: Content = {
        thought: `The user wants to execute a market buy for amount ${amount}. I will process this order.`,
        text: `I've executed your market buy order for amount ${amount}\nResult: ${JSON.stringify(result)}`,
        actions: ['MARKET_BUY'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in MARKET_BUY action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error executing the market buy.',
        text: `I'm sorry, I couldn't execute the market buy. Error: ${error.message}`,
        actions: ['MARKET_BUY'],
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
          text: 'Execute a market buy for amount 5',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "I've executed your market buy order for amount 5",
          actions: ['MARKET_BUY'],
        },
      },
    ],
  ],
};
