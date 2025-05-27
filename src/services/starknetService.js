import { Contract, Provider, constants } from 'starknet';
import STARKNET_CONFIG from '../config/starknet';

class StarknetService {
    constructor() {
        this.provider = new Provider({ sequencer: { network: STARKNET_CONFIG.NETWORK } });
        this.contract = new Contract(
            STARKNET_CONFIG.CONTRACT_ABI,
            STARKNET_CONFIG.CONTRACT_ADDRESS,
            this.provider
        );
    }

    // Conectar la billetera Argent
    async connectWallet() {
        try {
            if (!window.starknet) {
                throw new Error('Por favor, instala la extensión de Argent');
            }

            await window.starknet.enable();
            this.contract.connect(window.starknet.account);
            return true;
        } catch (error) {
            console.error('Error al conectar la billetera:', error);
            throw error;
        }
    }

    // Generar token para un usuario
    async generateToken(userId) {
        try {
            if (!this.contract.connected) {
                await this.connectWallet();
            }

            const tx = await this.contract.generate_token(userId);
            await this.provider.waitForTransaction(tx.transaction_hash);
            return tx;
        } catch (error) {
            console.error('Error al generar token:', error);
            throw error;
        }
    }

    // Obtener el último token generado
    async getLastToken() {
        try {
            const token = await this.contract.get_last_token();
            return token;
        } catch (error) {
            console.error('Error al obtener el último token:', error);
            throw error;
        }
    }

    // Verificar si la billetera está conectada
    isWalletConnected() {
        return window.starknet?.isConnected || false;
    }

    // Obtener la dirección de la billetera
    getWalletAddress() {
        return window.starknet?.selectedAddress;
    }
}

export default new StarknetService(); 