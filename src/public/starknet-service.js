class StarknetService {
    constructor() {
        this.wallet = null;
        this.contract = null;
        this.contractAddress = '0x123...'; // Reemplazar con la dirección real del contrato
    }

    async connectWallet() {
        try {
            if (!window.starknet) {
                throw new Error('Por favor, instala la extensión de Starknet');
            }

            await window.starknet.enable();
            this.wallet = window.starknet;
            
            // Inicializar contrato
            this.contract = new starknet.Contract(ABI, this.contractAddress);
            
            return true;
        } catch (error) {
            console.error('Error al conectar billetera:', error);
            throw error;
        }
    }

    isWalletConnected() {
        return this.wallet !== null && this.wallet.isConnected;
    }

    getWalletAddress() {
        return this.wallet?.selectedAddress;
    }

    async generateEncryptionToken(userId) {
        try {
            if (!this.isWalletConnected()) {
                throw new Error('Billetera no conectada');
            }

            // Generar token único usando Starknet
            const token = await this.contract.generateToken(userId);
            
            // Guardar token en localStorage
            localStorage.setItem('encryptionToken', token);
            
            return token;
        } catch (error) {
            console.error('Error al generar token:', error);
            throw error;
        }
    }

    getEncryptionToken() {
        return localStorage.getItem('encryptionToken');
    }

    async encryptPassword(password) {
        const token = this.getEncryptionToken();
        if (!token) {
            throw new Error('No hay token de cifrado disponible');
        }

        // Usar el token para cifrar la contraseña
        return CryptoJS.AES.encrypt(password, token).toString();
    }

    async decryptPassword(encryptedPassword) {
        const token = this.getEncryptionToken();
        if (!token) {
            throw new Error('No hay token de cifrado disponible');
        }

        // Usar el token para descifrar la contraseña
        const bytes = CryptoJS.AES.decrypt(encryptedPassword, token);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    async generateQRCode() {
        const token = this.getEncryptionToken();
        if (!token) {
            throw new Error('No hay token de cifrado disponible');
        }

        // Generar QR con el token
        const qrData = {
            type: 'encryption_token',
            token: token,
            timestamp: Date.now()
        };

        return JSON.stringify(qrData);
    }
}

// Exportar instancia
window.starknetService = new StarknetService(); 