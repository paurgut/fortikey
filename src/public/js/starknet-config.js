// Elementos del DOM
const connectWalletBtn = document.getElementById('connectWalletBtn');
const generateTokenBtn = document.getElementById('generateTokenBtn');
const showQRBtn = document.getElementById('showQRBtn');
const walletStatus = document.getElementById('walletStatus');
const walletAddress = document.getElementById('walletAddress');
const tokenStatus = document.getElementById('tokenStatus');
const lastToken = document.getElementById('lastToken');

// Inicializar servicio
async function initializeStarknet() {
    try {
        await window.starknetService.initialize();
        updateUI();
    } catch (error) {
        console.error('Error al inicializar Starknet:', error);
        showNotification('Error', 'No se pudo inicializar Starknet');
    }
}

// Actualizar UI
function updateUI() {
    const isConnected = window.starknetService.isWalletConnected();
    const address = window.starknetService.getWalletAddress();

    // Actualizar estado de la billetera
    walletStatus.textContent = isConnected ? 'Conectada' : 'No conectada';
    walletStatus.className = `form-control-plaintext ${isConnected ? 'text-success' : 'text-danger'}`;
    walletAddress.textContent = address || '-';
    connectWalletBtn.textContent = isConnected ? 'Desconectar Billetera' : 'Conectar Billetera';

    // Actualizar estado del token
    const hasToken = !!window.starknetService.encryptionKey;
    tokenStatus.textContent = hasToken ? 'Generado' : 'No generado';
    tokenStatus.className = `form-control-plaintext ${hasToken ? 'text-success' : 'text-danger'}`;
    lastToken.textContent = hasToken ? '••••••••' : '-';

    // Actualizar botones
    generateTokenBtn.disabled = !isConnected;
    showQRBtn.disabled = !hasToken;
}

// Mostrar notificación
function showNotification(title, message) {
    const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
    document.getElementById('notificationTitle').textContent = title;
    document.getElementById('notificationMessage').textContent = message;
    notificationModal.show();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeStarknet();

    // Conectar/Desconectar billetera
    connectWalletBtn.addEventListener('click', async () => {
        try {
            if (!window.starknetService.isWalletConnected()) {
                await window.starknetService.connectWallet();
                showNotification('Éxito', 'Billetera conectada correctamente');
            } else {
                window.starknetService.clearConfig();
                showNotification('Info', 'Billetera desconectada');
            }
            updateUI();
        } catch (error) {
            showNotification('Error', error.message);
        }
    });

    // Generar token
    generateTokenBtn.addEventListener('click', async () => {
        try {
            const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
            if (!sessionData || !sessionData.user) {
                throw new Error('Usuario no autenticado');
            }

            const token = await window.starknetService.generateEncryptionToken(sessionData.user.id);
            showNotification('Éxito', 'Token generado correctamente');
            updateUI();
        } catch (error) {
            showNotification('Error', error.message);
        }
    });

    // Mostrar QR
    showQRBtn.addEventListener('click', async () => {
        try {
            const qrData = await window.starknetService.generateQRCode();
            const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
            
            // Limpiar QR anterior si existe
            const qrContainer = document.getElementById('qrCode');
            qrContainer.innerHTML = '';
            
            // Generar nuevo QR
            new QRCode(qrContainer, {
                text: qrData,
                width: 256,
                height: 256
            });
            
            qrModal.show();
        } catch (error) {
            showNotification('Error', error.message);
        }
    });
}); 