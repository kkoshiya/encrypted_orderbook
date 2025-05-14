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
 * Action to get orderbook configuration
 */
export const getConfigAction: Action = {
  name: 'GET_CONFIG',
  similes: ['FETCH_CONFIG', 'SHOW_CONFIG', 'VIEW_SETTINGS'],
  description: 'Fetches the configuration of the encrypted orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('get config') ||
      text.includes('show config') ||
      text.includes('view config') ||
      text.includes('get settings') ||
      text.includes('show settings')
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
      logger.info('Handling GET_CONFIG action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Fetch config from the service
      const config = await orderbookService.getConfig();

      // Format config for display
      const formattedConfig = JSON.stringify(config, null, 2);
      
      // Create response content
      const responseContent: Content = {
        thought: 'The user wants to see the orderbook configuration. I will fetch it and display it in a readable format.',
        text: `Here is the orderbook configuration:\n\`\`\`json\n${formattedConfig}\n\`\`\``,
        actions: ['GET_CONFIG'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in GET_CONFIG action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error fetching the orderbook configuration.',
        text: `I'm sorry, I couldn't fetch the orderbook configuration. Error: ${error.message}`,
        actions: ['GET_CONFIG'],
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
          text: 'Show me the orderbook configuration',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Here is the orderbook configuration: [config data]',
          actions: ['GET_CONFIG'],
        },
      },
    ],
  ],
};

/**
 * Action to update orderbook configuration
 */
export const updateConfigAction: Action = {
  name: 'UPDATE_CONFIG',
  similes: ['CHANGE_CONFIG', 'SET_CONFIG', 'MODIFY_SETTINGS'],
  description: 'Updates the configuration of the encrypted orderbook',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('update config') ||
      text.includes('change config') ||
      text.includes('set config') ||
      text.includes('modify settings') ||
      text.includes('update settings')
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
      logger.info('Handling UPDATE_CONFIG action');

      // Get the orderbook service
      const orderbookService = runtime.getService('orderbook') as OrderbookService;
      if (!orderbookService) {
        throw new Error('Orderbook service not found');
      }

      // Parse config from message - this is a simplified version
      // In a real implementation, you would need more sophisticated parsing
      const text = message.content.text.toLowerCase();
      const config: any = {};
      
      // Simple parsing for key=value pairs
      const keyValuePairs = text.match(/([a-zA-Z_]+)\s*=\s*([^\s,]+)/g);
      if (!keyValuePairs) {
        const errorContent: Content = {
          thought: 'The user wants to update the configuration but did not provide any key=value pairs.',
          text: "I need key=value pairs to update the configuration. Please specify them like 'update config key1=value1, key2=value2'.",
          actions: ['UPDATE_CONFIG'],
          source: message.content.source,
        };
        
        await callback(errorContent);
        return errorContent;
      }
      
      // Parse each key=value pair
      keyValuePairs.forEach(pair => {
        const [key, value] = pair.split('=').map(s => s.trim());
        
        // Try to convert value to number if possible
        const numValue = Number(value);
        config[key] = isNaN(numValue) ? value : numValue;
      });
      
      // Update config
      const result = await orderbookService.updateConfig(config);
      
      // Create response content
      const responseContent: Content = {
        thought: `The user wants to update the orderbook configuration with ${JSON.stringify(config)}. I will apply these changes.`,
        text: `I've updated the orderbook configuration.\nResult: ${JSON.stringify(result)}`,
        actions: ['UPDATE_CONFIG'],
        source: message.content.source,
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in UPDATE_CONFIG action:', error);
      
      // Create error response
      const errorContent: Content = {
        thought: 'There was an error updating the orderbook configuration.',
        text: `I'm sorry, I couldn't update the orderbook configuration. Error: ${error.message}`,
        actions: ['UPDATE_CONFIG'],
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
          text: 'Update orderbook config with fee=0.1, min_order=0.01',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "I've updated the orderbook configuration.",
          actions: ['UPDATE_CONFIG'],
        },
      },
    ],
  ],
};
