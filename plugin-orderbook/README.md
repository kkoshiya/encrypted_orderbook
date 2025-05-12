# Encrypted Orderbook Plugin for ElizaOS

This plugin integrates the Encrypted Orderbook with ElizaOS, allowing agents to interact with the orderbook through natural language commands.

## Development

```bash
# Start development with hot-reloading
npm run dev

# Build the plugin
npm run build

# Test the plugin
npm run test
```

## Publishing

Before publishing your plugin to the ElizaOS registry, ensure you meet these requirements:

1. **GitHub Repository**
   - Create a public GitHub repository for this plugin
   - Add the 'elizaos-plugins' topic to the repository
   - Use 'main' as the default branch

2. **Required Assets**
   - Add images to the `images/` directory:
     - `logo.jpg` (400x400px square, <500KB)
     - `banner.jpg` (1280x640px, <1MB)

3. **Publishing Process**
   ```bash
   # Check if your plugin meets all registry requirements
   npx elizaos publish --test
   
   # Publish to the registry
   npx elizaos publish
   ```

After publishing, your plugin will be submitted as a pull request to the ElizaOS registry for review.

## Configuration

The `agentConfig` section in `package.json` defines the parameters your plugin requires:

```json
"agentConfig": {
  "pluginType": "elizaos:plugin:1.0.0",
  "pluginParameters": {
    "API_KEY": {
      "type": "string",
      "description": "API key for the service"
    }
  }
}
```

Customize this section to match your plugin's requirements.

## Documentation

### What this plugin does

The Encrypted Orderbook Plugin allows ElizaOS agents to interact with the encrypted orderbook API. It provides actions for:

- Getting and placing orders
- Executing market buy/sell operations
- Viewing trade fills
- Managing FHE keys for encryption
- Configuring the orderbook
- Resetting the orderbook

### How to use it

1. Make sure the orderbook server is running (typically on http://localhost:8080)
2. Start ElizaOS with this plugin
3. Interact with the agent using natural language commands

### Required configuration

The plugin requires the following configuration:

- `ORDERBOOK_API_URL`: URL of the orderbook API (default: http://localhost:8080)

### Example usage

```
# Get all orders
"Show me the current orders in the orderbook"

# Add a limit order
"Add a buy order at price 100 with amount 5"

# Execute a market buy
"Execute a market buy for amount 3"

# Execute a market sell
"Execute a market sell for amount 2"

# View fills
"Show me the fills in the orderbook"

# Generate FHE keys
"Generate FHE keys for the orderbook"

# Get configuration
"Show me the orderbook configuration"

# Update configuration
"Update orderbook config with fee=0.1, min_order=0.01"

# Reset the orderbook
"Reset the orderbook"
```
