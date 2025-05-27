// Configuración de Starknet
const STARKNET_CONFIG = {
    // Contrato desplegado en testnet
    CONTRACT_ADDRESS: '0x0', // Reemplazar con la dirección del contrato desplegado
    // ABI del contrato
    CONTRACT_ABI: [
        {
            "name": "generate_token",
            "type": "function",
            "inputs": [
                {
                    "name": "user_id",
                    "type": "felt252"
                }
            ],
            "outputs": []
        },
        {
            "name": "get_last_token",
            "type": "function",
            "inputs": [],
            "outputs": [
                {
                    "name": "token",
                    "type": "felt252"
                }
            ]
        }
    ],
    // Red de Starknet (testnet o mainnet)
    NETWORK: 'testnet',
    // RPC URL de Starknet
    RPC_URL: 'https://starknet-testnet.infura.io/v3/YOUR-PROJECT-ID'
};

export default STARKNET_CONFIG; 