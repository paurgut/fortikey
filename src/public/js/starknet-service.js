class StarknetService {
    constructor() {
        this.wallet = null;
        this.isConnected = false;
        this.walletAddress = null;
        this.encryptionKey = null;
        this.contractAddress = '0x0209c0708d3ED094E6901CbC3fB22c037ff01866B8aE0e1B718214e84d2d9db6'; 
        // Aquí debes poner la dirección de tu contrato desplegado
    }

    async initialize() {
        try {
            // Verificar si existe la configuración guardada
            const config = localStorage.getItem('starknetConfig');
            if (config) {
                const { walletAddress, encryptionKey } = JSON.parse(config);
                this.walletAddress = walletAddress;
                this.encryptionKey = encryptionKey;
                this.isConnected = true;
            }

            // Verificar si la billetera está disponible
            if (typeof window.starknet !== 'undefined') {
                this.wallet = window.starknet;
                // Verificar si ya está conectada
                if (this.wallet.isConnected) {
                    this.isConnected = true;
                    this.walletAddress = this.wallet.selectedAddress;
                }
            }

            return true;
        } catch (error) {
            console.error('Error al inicializar Starknet:', error);
            return false;
        }
    }

    async connectWallet() {
        try {
            if (typeof window.starknet === 'undefined') {
                throw new Error('Por favor, instala la extensión de Starknet (Argent X)');
            }

            // Verificar si ya está conectada
            if (this.isConnected && this.wallet.isConnected) {
                return this.walletAddress;
            }

            // Intentar conectar
            const [address] = await window.starknet.enable();
            
            if (!address) {
                throw new Error('No se pudo obtener la dirección de la billetera');
            }

            this.wallet = window.starknet;
            this.walletAddress = address;
            this.isConnected = true;

            // Guardar configuración
            this.saveConfig();

            console.log('Billetera conectada:', this.walletAddress);
            return this.walletAddress;
        } catch (error) {
            console.error('Error al conectar billetera:', error);
            this.isConnected = false;
            this.walletAddress = null;
            throw new Error('Error al conectar la billetera: ' + error.message);
        }
    }

    async generateEncryptionToken(userId) {
        try {
            // Verificar conexión
            if (!this.isConnected || !this.wallet || !this.wallet.isConnected) {
                throw new Error('Billetera no conectada');
            }

            // Llamar al contrato para generar el token
            const contract = await this.getContract();
            
            // Convertir userId a felt252
            const feltUserId = BigInt(userId);
            
            console.log('Generando token para userId:', feltUserId);
            
            // Ejecutar la transacción
            const result = await contract.generate_token(feltUserId);
            console.log('Transacción enviada:', result);
            
            await this.wallet.waitForTransaction(result.transaction_hash);
            console.log('Transacción confirmada');
            
            // Obtener el token generado
            const token = await contract.get_last_token();
            this.encryptionKey = token.toString();

            // Guardar configuración
            this.saveConfig();

            return this.encryptionKey;
        } catch (error) {
            console.error('Error al generar token:', error);
            throw new Error('Error al generar token: ' + error.message);
        }
    }

    async getContract() {
        if (!this.wallet || !this.wallet.isConnected) {
            throw new Error('Billetera no conectada');
        }

        // ABI del contrato
        const contractABI = [
            {
                name: "generate_token",
                type: "function",
                inputs: [{ name: "user_id", type: "felt" }],
                outputs: []
            },
            {
                name: "get_last_token",
                type: "function",
                inputs: [],
                outputs: [{ name: "token", type: "felt" }]
            }
        ];

        try {
            // Crear instancia del contrato usando la API correcta
            const contract = new this.wallet.Contract(
                contractABI,
                this.contractAddress
            );

            return contract;
        } catch (error) {
            console.error('Error al crear instancia del contrato:', error);
            throw new Error('Error al crear instancia del contrato: ' + error.message);
        }
    }

    async generateQRCode() {
        try {
            if (!this.encryptionKey) {
                throw new Error('No hay token de encriptación generado');
            }

            const qrData = {
                type: 'starknet-token',
                address: this.walletAddress,
                token: this.encryptionKey,
                timestamp: Date.now()
            };

            return JSON.stringify(qrData);
        } catch (error) {
            console.error('Error al generar QR:', error);
            throw new Error('Error al generar código QR: ' + error.message);
        }
    }

    async encryptPassword(password) {
        try {
            if (!this.encryptionKey) {
                throw new Error('No hay token de encriptación generado');
            }

            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const key = await this.importKey(this.encryptionKey);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encryptedData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );

            return {
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encryptedData))
            };
        } catch (error) {
            console.error('Error al encriptar contraseña:', error);
            throw new Error('Error al encriptar contraseña: ' + error.message);
        }
    }

    async decryptPassword(encryptedData) {
        try {
            if (!this.encryptionKey) {
                throw new Error('No hay token de encriptación generado');
            }

            const key = await this.importKey(this.encryptionKey);
            const iv = new Uint8Array(encryptedData.iv);
            const data = new Uint8Array(encryptedData.data);

            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );

            return new TextDecoder().decode(decryptedData);
        } catch (error) {
            console.error('Error al desencriptar contraseña:', error);
            throw new Error('Error al desencriptar contraseña: ' + error.message);
        }
    }

    async hashData(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async importKey(key) {
        const keyData = await this.hashData(key);
        const keyBuffer = new Uint8Array(keyData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    saveConfig() {
        const config = {
            walletAddress: this.walletAddress,
            encryptionKey: this.encryptionKey
        };
        localStorage.setItem('starknetConfig', JSON.stringify(config));
    }

    clearConfig() {
        localStorage.removeItem('starknetConfig');
        this.wallet = null;
        this.isConnected = false;
        this.walletAddress = null;
        this.encryptionKey = null;
    }

    getWalletAddress() {
        return this.walletAddress;
    }

    isWalletConnected() {
        return this.isConnected;
    }
}

// Crear instancia global
window.starknetService = new StarknetService(); 