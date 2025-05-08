#!/bin/bash

# Script to generate FHE keys for the encrypted orderbook

echo "Generating FHE keys for encrypted orderbook..."

# Create the keys directory if it doesn't exist
mkdir -p keys

# Send a request to the API to generate keys
curl -X POST http://localhost:3000/generate-keys

echo "Keys generation request sent. Check the server logs for details."
