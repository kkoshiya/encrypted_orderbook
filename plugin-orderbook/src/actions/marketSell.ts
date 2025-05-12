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
 * Action to execute a market sell order
 */
export const marketSellAction: Action = {
  name: 'MARKET_SELL',
  similes: ['SELL_MARKET', 'EXECUTE_SELL', 'SELL_NOW'],
  description: 'Executes a market sell order on the orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('market sell') ||
      text.includes('sell at market') ||
      text.includes('sell now') ||
      (text.includes('sell') && !text.includes('limit'))
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
      logger.info('Handling MARKET_SELL action');

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
                          text.match(/sell[:\s]+(\d+(\.\d+)?)/i);
      
      if (!amountMatch) {
        const errorContent: Content = {
          thought: 'The user wants to execute a market sell but did not provide the amount.',
          text: "I need the amount to execute a market sell. Please specify it like 'market sell amount 5'.",
          actions: ['MARKET_SELL'],
          source: message.content.source,
        };
        
        await callback(errorContent);
        return errorContent;
      }
      
      const amount = parseFloat(amountMatch[1]);
      
      // Execute the market sell
      const result = await orderbookService.marketSell(amount);
      
      // Create response content
      const responseContent: Content = {
        thought: `The user wants to execute a market sell for amount ${amount}. I will process this order.`,
        text: `I've executed your market sell order for amount ${amount}\nResult: ${JSON.stringify(result)}`,
        actions: ['MARKET_SELL'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in MARKET_SELL action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error executing the market sell.',
        text: `I'm sorry, I couldn't execute the market sell. Error: ${error.message}`,
        actions: ['MARKET_SELL'],
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
          text: 'Execute a market sell for amount 5',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "I've executed your market sell order for amount 5",
          actions: ['MARKET_SELL'],
        },
      },
    ],
  ],
};
