#!/bin/bash

# Archivo de configuración de cuenta Argent X generado con:
# starkli account argent init ./account.json

ACCOUNT_FILE="./account.json"
NETWORK="alpha-mainnet"
CONTRACT_FILE="./contracts/target/dev/fortikey.sierra.json"

# Verificar que el archivo de cuenta exista
if [ ! -f "$ACCOUNT_FILE" ]; then
    echo "Error: No se encontró el archivo de cuenta $ACCOUNT_FILE"
    echo "Ejecuta: starkli account argent init $ACCOUNT_FILE"
    exit 1
fi

# Verificar que el archivo del contrato exista
if [ ! -f "$CONTRACT_FILE" ]; then
    echo "Error: No se encontró el archivo de contrato $CONTRACT_FILE"
    exit 1
fi

echo "Declarando contrato..."
DECLARE_OUTPUT=$(starkli declare --account "$ACCOUNT_FILE" --network "$NETWORK" "$CONTRACT_FILE" 2>&1)
if [ $? -ne 0 ]; then
    echo "Error al declarar el contrato:"
    echo "$DECLARE_OUTPUT"
    exit 1
fi

echo "$DECLARE_OUTPUT"

# Extraer el class hash (asumiendo que la salida contiene la línea con 'class hash:')
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -i 'class hash:' | awk '{print $3}')
if [ -z "$CLASS_HASH" ]; then
    echo "No se pudo obtener el class hash del output de declaración."
    exit 1
fi

echo "Class Hash: $CLASS_HASH"

echo "Desplegando contrato..."
DEPLOY_OUTPUT=$(starkli deploy "$CLASS_HASH" --network "$NETWORK" 2>&1)
if [ $? -ne 0 ]; then
    echo "Error al desplegar el contrato:"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "$DEPLOY_OUTPUT"

# Extraer la dirección del contrato desplegado (asumiendo que la salida contiene 'contract address:')
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -i 'contract address:' | awk '{print $3}')
if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "No se pudo obtener la dirección del contrato desplegado."
    exit 1
fi

echo "Contrato desplegado en: $CONTRACT_ADDRESS"
echo "Actualiza esta dirección en src/public/js/starknet-service.js"

