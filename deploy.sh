#!/bin/bash

# Configuración manual (sustituye por tus datos)
PRIVATE_KEY="0x03233558066c381cdc8c34a7e5c6bf5fba3a28857ace4aa50e6141f2228e779e"
ACCOUNT_ADDRESS="0x0209c0708d3ED094E6901CbC3fB22c037ff01866B8aE0e1B718214e84d2d9db6"
NETWORK="alpha-mainnet"
SIERRA_PATH="./contracts/target/dev/fortikey.sierra.json"

# Verificar existencia de archivo CASM
CASM_PATH="./contracts/target/dev/fortikey.casm.json"
if [ ! -f "$CASM_PATH" ]; then
    echo "Error: No se encuentra el archivo casm en $CASM_PATH"
    exit 1
fi

# Construir JSON del account en línea
ACCOUNT_JSON=$(jq -n --arg addr "$ACCOUNT_ADDRESS" --arg key "$PRIVATE_KEY" \
  '{address: $addr, signer: {type: "raw", privateKey: $key}}')

# Declarar el contrato
echo "Declarando contrato..."
OUTPUT=$(starkli declare \
  --account "$ACCOUNT_JSON" \
  --network "$NETWORK" \
  "$SIERRA_PATH" 2>&1)

echo "$OUTPUT"

# Extraer class hash
CLASS_HASH=$(echo "$OUTPUT" | grep "class hash:" | awk '{print $3}')

if [ -z "$CLASS_HASH" ]; then
    echo "❌ Error al declarar el contrato"
    exit 1
fi

echo "✅ Class Hash: $CLASS_HASH"

# Desplegar el contrato
echo "Desplegando contrato..."
DEPLOY_OUTPUT=$(starkli deploy "$CLASS_HASH" \
  --account "$ACCOUNT_JSON" \
  --network "$NETWORK" 2>&1)

echo "$DEPLOY_OUTPUT"

CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "contract address:" | awk '{print $3}')

if [ -z "$]()
