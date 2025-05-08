import orderBookAction from './orderbook_action';

// Export the orderbook action for ElizaOS
export default {
  actions: [orderBookAction],
  name: 'fhe-orderbook',
  version: '0.1.0',
  description: 'Encrypted orderbook using Fully Homomorphic Encryption (FHE) for Solana',
};
