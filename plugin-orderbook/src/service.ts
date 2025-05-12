import { Service, IAgentRuntime, logger } from '@elizaos/core';
import axios from 'axios';

/**
 * OrderbookService provides methods to interact with the orderbook API
 */
export class OrderbookService extends Service {
  static serviceType = 'orderbook';
  private baseUrl: string;
  
  capabilityDescription = 'This service integrates with the encrypted orderbook API';
  
  constructor(protected runtime: IAgentRuntime) {
    super(runtime);
    // Get config from environment variables
    this.baseUrl = process.env.ORDERBOOK_API_URL || 'http://localhost:8080';
    logger.info(`OrderbookService initialized with API URL: ${this.baseUrl}`);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info(`Starting OrderbookService at ${new Date().toISOString()}`);
    // Config is now handled in the constructor
    const service = new OrderbookService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('Stopping OrderbookService');
    const service = runtime.getService(OrderbookService.serviceType);
    if (!service) {
      throw new Error('OrderbookService not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('OrderbookService stopped');
  }

  /**
   * Get all orders from the orderbook
   */
  async getOrders() {
    try {
      logger.info('Fetching orders from orderbook');
      const response = await axios.get(`${this.baseUrl}/orders`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Add a new limit order to the orderbook
   */
  async addOrder(order: { side: 'buy' | 'sell'; price: number; amount: number }) {
    try {
      logger.info(`Adding ${order.side} order: ${order.amount} @ ${order.price}`);
      const response = await axios.post(`${this.baseUrl}/orders`, order);
      return response.data;
    } catch (error) {
      logger.error('Error adding order:', error);
      throw error;
    }
  }

  /**
   * Execute a market buy order
   */
  async marketBuy(amount: number) {
    try {
      logger.info(`Executing market buy for amount: ${amount}`);
      const response = await axios.post(`${this.baseUrl}/market-buy`, { amount });
      return response.data;
    } catch (error) {
      logger.error('Error executing market buy:', error);
      throw error;
    }
  }

  /**
   * Execute a market sell order
   */
  async marketSell(amount: number) {
    try {
      logger.info(`Executing market sell for amount: ${amount}`);
      const response = await axios.post(`${this.baseUrl}/market-sell`, { amount });
      return response.data;
    } catch (error) {
      logger.error('Error executing market sell:', error);
      throw error;
    }
  }

  /**
   * Get all fills from the orderbook
   */
  async getFills() {
    try {
      logger.info('Fetching fills from orderbook');
      const response = await axios.get(`${this.baseUrl}/fills`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching fills:', error);
      throw error;
    }
  }

  /**
   * Generate FHE keys for the orderbook
   */
  async generateKeys() {
    try {
      logger.info('Generating FHE keys');
      const response = await axios.post(`${this.baseUrl}/generate-keys`);
      return response.data;
    } catch (error) {
      logger.error('Error generating keys:', error);
      throw error;
    }
  }

  /**
   * Get orderbook configuration
   */
  async getConfig() {
    try {
      logger.info('Fetching orderbook configuration');
      const response = await axios.get(`${this.baseUrl}/config`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching configuration:', error);
      throw error;
    }
  }

  /**
   * Update orderbook configuration
   */
  async updateConfig(config: any) {
    try {
      logger.info('Updating orderbook configuration');
      const response = await axios.post(`${this.baseUrl}/config`, config);
      return response.data;
    } catch (error) {
      logger.error('Error updating configuration:', error);
      throw error;
    }
  }

  /**
   * Reset the orderbook
   */
  async resetOrderbook() {
    try {
      logger.info('Resetting orderbook');
      const response = await axios.post(`${this.baseUrl}/reset`);
      return response.data;
    } catch (error) {
      logger.error('Error resetting orderbook:', error);
      throw error;
    }
  }
}
