// Configuración
const API_URL = 'https://fortikey.onrender.com';

// Elementos del DOM
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeSwitch = document.getElementById('darkModeSwitch');
const userDropdown = document.getElementById('userDropdown');
const userName = document.getElementById('userName');
const totalPasswords = document.getElementById('totalPasswords');
const lastAccess = document.getElementById('lastAccess');
const securityStatus = document.getElementById('securityStatus');
const recentPasswords = document.getElementById('recentPasswords');
const passwordsList = document.getElementById('passwordsList');
const qrScanner = document.getElementById('qrScanner');
const qrVideo = document.getElementById('qrVideo');
const togglePassword = document.getElementById('togglePassword');
const passwordForm = document.getElementById('addPasswordForm');
const generatePasswordBtn = document.getElementById('generatePasswordBtn');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const savePasswordBtn = document.getElementById('savePasswordBtn');
const passwordsTable = document.getElementById('passwordsTable');
const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');

// Elementos del DOM para Starknet
const connectWalletBtn = document.getElementById('connectWalletBtn');
const generateTokenBtn = document.getElementById('generateTokenBtn');
const walletStatus = document.getElementById('walletStatus');
const lastToken = document.getElementById('lastToken');
const showQRBtn = document.getElementById('showQRBtn');
const tokenStatus = document.getElementById('tokenStatus');

// Variables globales
let currentUser = null;
let passwords = [];
let scanner = null;

// Función global para cerrar sesión
window.logout = function() {
    console.log('Cerrando sesión...');
    sessionStorage.clear();
    window.location.href = 'index.html';
};

// Verificar autenticación
function checkAuth() {
    const sessionData = sessionStorage.getItem('currentSession');
    
    if (!sessionData) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const session = JSON.parse(sessionData);
        currentUser = session.user;
        if (userName) userName.textContent = currentUser.username;
        loadPasswords();
        updateLastAccess();
    } catch (error) {
        console.error('Error al cargar la sesión:', error);
        window.location.href = 'index.html';
    }
}

// Cargar contraseñas
async function loadPasswords() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
        if (!sessionData || !sessionData.token) {
            throw new Error('Sesión inválida');
        }
        
        const response = await fetch(`${API_URL}/passwords`, {
            headers: {
                'Authorization': `Bearer ${sessionData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar contraseñas');
        }
        
        const data = await response.json();
        passwords = Array.isArray(data) ? data : [];
        
        // Ordenar contraseñas por fecha de actualización (más recientes primero)
        passwords.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        renderPasswords();
        updateDashboardStats();
    } catch (error) {
        console.error('Error al cargar contraseñas:', error);
        showNotification('Error', 'No se pudieron cargar las contraseñas');
    }
}

// Renderizar contraseñas
function renderPasswords() {
    // Renderizar en la tabla de contraseñas recientes
    if (recentPasswords) {
        recentPasswords.innerHTML = '';
        const recentPasswordsList = passwords.slice(0, 5); // Mostrar solo las 5 más recientes
        recentPasswordsList.forEach(password => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${password.serviceName}</td>
                <td>${password.username || '-'}</td>
                <td>${new Date(password.updatedAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showPassword('${password.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePassword('${password.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            recentPasswords.appendChild(tr);
        });
    }

    // Renderizar en la tabla de todas las contraseñas
    const passwordsTable = document.getElementById('passwordsTable');
    if (passwordsTable) {
        passwordsTable.innerHTML = '';
        passwords.forEach(password => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${password.serviceName}</td>
                <td><a href="${password.url}" target="_blank">${password.url || '-'}</a></td>
                <td>${password.username || '-'}</td>
                <td>${new Date(password.updatedAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-info me-2" onclick="showPassword('${password.id}')">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePassword('${password.id}')">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            `;
            passwordsTable.appendChild(tr);
        });
    }
}

// Actualizar estadísticas del dashboard
function updateDashboardStats() {
    if (totalPasswords) totalPasswords.textContent = passwords.length;
    if (securityStatus) securityStatus.textContent = passwords.length > 0 ? 'Bueno' : 'Sin contraseñas';
}

// Actualizar último acceso
function updateLastAccess() {
    if (lastAccess) {
        const now = new Date();
        lastAccess.textContent = now.toLocaleTimeString();
    }
}

// Mostrar notificación
function showNotification(title, message) {
    const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (notificationTitle) notificationTitle.textContent = title;
    if (notificationMessage) notificationMessage.textContent = message;
    if (notificationModal) notificationModal.show();
}

// Mostrar contraseña
async function showPassword(id) {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
        if (!sessionData || !sessionData.token) {
            throw new Error('Sesión inválida');
        }

        const response = await fetch(`${API_URL}/passwords/${id}`, {
            headers: {
                'Authorization': `Bearer ${sessionData.token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener la contraseña');
        }
        
        const data = await response.json();
        
        // Crear y mostrar el modal
        const modalHtml = `
            <div class="modal fade" id="passwordModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles de la Contraseña</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Servicio:</label>
                                <p class="form-control-plaintext">${data.serviceName}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">URL:</label>
                                <p class="form-control-plaintext">${data.url || 'No especificada'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Usuario:</label>
                                <p class="form-control-plaintext">${data.username || 'No especificado'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Contraseña:</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" value="${data.password}" id="passwordField" readonly>
                                    <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility()">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-primary" type="button" onclick="copyPassword()">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const oldModal = document.getElementById('passwordModal');
        if (oldModal) {
            oldModal.remove();
        }

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('passwordModal'));
        modal.show();
    } catch (error) {
        console.error('Error al mostrar contraseña:', error);
        showNotification('Error', 'No se pudo obtener la contraseña: ' + error.message);
    }
}

// Función para alternar visibilidad de la contraseña
window.togglePasswordVisibility = function() {
    const passwordField = document.getElementById('passwordField');
    const icon = document.querySelector('#passwordModal .bi-eye');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        passwordField.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
};

// Función para copiar contraseña
window.copyPassword = function() {
    const passwordField = document.getElementById('passwordField');
    passwordField.select();
    document.execCommand('copy');
    showNotification('Éxito', 'Contraseña copiada al portapapeles');
};

// Eliminar contraseña
async function deletePassword(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta contraseña?')) return;
    
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
        const response = await fetch(`${API_URL}/passwords/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionData.token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar la contraseña');
        
        passwords = passwords.filter(p => p.id !== id);
        renderPasswords();
        updateDashboardStats();
        showNotification('Éxito', 'Contraseña eliminada correctamente');
    } catch (error) {
        showNotification('Error', 'No se pudo eliminar la contraseña');
    }
}

// Inicializar escáner QR
async function initQRScanner() {
    try {
        scanner = new Html5Qrcode("qrScanner");
        await scanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
                handleQRCode(decodedText);
            },
            (error) => {
                console.warn(`QR Code error: ${error}`);
            }
        );
    } catch (error) {
        console.error('Error al inicializar el escáner QR:', error);
        alert('Error al inicializar el escáner QR');
    }
}

// Manejar código QR
function handleQRCode(code) {
    try {
        const data = JSON.parse(code);
        if (data.type === 'password') {
            document.getElementById('serviceName').value = data.serviceName || '';
            document.getElementById('serviceUrl').value = data.url || '';
            document.getElementById('serviceUsername').value = data.username || '';
            document.getElementById('password').value = data.password || '';
            
            const modal = new bootstrap.Modal(document.getElementById('addPasswordModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error al procesar el código QR:', error);
        alert('Código QR inválido');
    }
}

// Generar contraseña segura
function generateSecurePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Mayúscula
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    password += '!@#$%^&*()_+~`|}{[]:;?><,./-='[Math.floor(Math.random() * 32)]; // Símbolo
    
    // Completar el resto de la contraseña
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mezclar la contraseña
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    return password;
}

// Event Listeners para Starknet
if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async () => {
        try {
            if (!starknetService.isWalletConnected()) {
                await starknetService.connectWallet();
                showNotification('Éxito', 'Billetera conectada correctamente');
                generateTokenBtn.disabled = false;
            } else {
                // Desconectar billetera
                window.starknet.disconnect();
                showNotification('Info', 'Billetera desconectada');
                generateTokenBtn.disabled = true;
                showQRBtn.disabled = true;
                tokenStatus.textContent = 'No generado';
            }
            updateWalletStatus();
        } catch (error) {
            showNotification('Error', error.message);
        }
    });
}

if (generateTokenBtn) {
    generateTokenBtn.addEventListener('click', async () => {
        try {
            if (!currentUser) {
                throw new Error('Usuario no autenticado');
            }

            const token = await starknetService.generateEncryptionToken(currentUser.id);
            tokenStatus.textContent = 'Generado';
            showQRBtn.disabled = false;
            showNotification('Éxito', 'Token generado correctamente');
        } catch (error) {
            showNotification('Error', error.message);
        }
    });
}

if (showQRBtn) {
    showQRBtn.addEventListener('click', async () => {
        try {
            const qrData = await starknetService.generateQRCode();
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
}

// Función para actualizar el estado de la billetera
async function updateWalletStatus() {
    if (starknetService.isWalletConnected()) {
        const address = starknetService.getWalletAddress();
        walletStatus.textContent = `Conectada: ${address}`;
        connectWalletBtn.textContent = 'Desconectar Billetera';
    } else {
        walletStatus.textContent = 'No conectada';
        connectWalletBtn.textContent = 'Conectar Billetera';
    }
}

// Guardar contraseña
async function savePassword(data) {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
        if (!sessionData || !sessionData.token) {
            throw new Error('Sesión inválida');
        }

        // Cifrar la contraseña
        const encryptedPassword = await starknetService.encryptPassword(data.password);
        
        const response = await fetch(`${API_URL}/passwords`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                password: encryptedPassword
            })
        });

        if (!response.ok) {
            throw new Error('Error al guardar la contraseña');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al guardar contraseña:', error);
        throw error;
    }
}

// Función para actualizar el estado de Starknet en el dashboard
async function updateStarknetStatus() {
    try {
        const isConnected = window.starknetService.isWalletConnected();
        const address = window.starknetService.getWalletAddress();
        const hasToken = !!window.starknetService.encryptionKey;

        // Actualizar estado de la billetera
        document.getElementById('dashboardWalletStatus').textContent = isConnected ? 'Conectada' : 'No conectada';
        document.getElementById('dashboardWalletAddress').textContent = address || '-';

        // Actualizar estado del token
        document.getElementById('dashboardTokenStatus').textContent = hasToken ? 'Generado' : 'No generado';
        document.getElementById('dashboardLastToken').textContent = hasToken ? '••••••••' : '-';
    } catch (error) {
        console.error('Error al actualizar estado de Starknet:', error);
    }
}

// Inicializar Starknet al cargar el dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.starknetService.initialize();
        updateStarknetStatus();
    } catch (error) {
        console.error('Error al inicializar Starknet:', error);
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover clase active de todos los links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al link clickeado
            link.classList.add('active');
            
            // Ocultar todas las secciones
            sections.forEach(section => section.style.display = 'none');
            
            // Mostrar la sección correspondiente
            const sectionId = link.id.replace('Link', 'Section');
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'block';
            
            // Inicializar escáner QR si es necesario
            if (sectionId === 'qrSection') {
                initQRScanner();
            } else if (scanner) {
                scanner.stop();
            }
        });
    });
    
    // Toggle sidebar en móvil
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (sidebar) sidebar.classList.toggle('show');
        });
    }
    
    // Dark mode
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                if (document.body.classList.contains('dark-mode')) {
                    icon.classList.remove('bi-moon');
                    icon.classList.add('bi-sun');
                    localStorage.setItem('darkMode', 'true');
                } else {
                    icon.classList.remove('bi-sun');
                    icon.classList.add('bi-moon');
                    localStorage.setItem('darkMode', 'false');
                }
            }
        });
    }
    
    // Cargar preferencias de tema
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            if (icon) icon.classList.replace('bi-moon', 'bi-sun');
        }
    }
    
    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const icon = togglePassword.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    });
    
    // Configuración
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = {
                darkMode: document.getElementById('darkModeSwitch').checked,
                notifications: document.getElementById('notificationsSwitch').checked
            };
            localStorage.setItem('settings', JSON.stringify(settings));
            showNotification('Éxito', 'Configuración guardada correctamente');
        });
    }

    // Manejar el modal de contraseñas
    const addPasswordModal = document.getElementById('addPasswordModal');
    if (addPasswordModal) {
        addPasswordModal.addEventListener('shown.bs.modal', () => {
            const form = document.getElementById('addPasswordForm');
            const generateBtn = document.getElementById('generatePasswordBtn');
            const toggleBtn = document.getElementById('togglePasswordBtn');
            const saveBtn = document.getElementById('savePasswordBtn');

            if (generateBtn) {
                generateBtn.onclick = () => {
                    const passwordInput = form.querySelector('input[name="password"]');
                    if (passwordInput) {
                        passwordInput.value = generateSecurePassword();
                        passwordInput.type = 'text';
                        const icon = toggleBtn.querySelector('i');
                        if (icon) icon.className = 'bi bi-eye-slash';
                    }
                };
            }

            if (toggleBtn) {
                toggleBtn.onclick = () => {
                    const passwordInput = form.querySelector('input[name="password"]');
                    if (passwordInput) {
                        const type = passwordInput.type === 'password' ? 'text' : 'password';
                        passwordInput.type = type;
                        const icon = toggleBtn.querySelector('i');
                        if (icon) icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
                    }
                };
            }

            if (saveBtn && form) {
                saveBtn.onclick = async () => {
                    try {
                        const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
                        if (!sessionData || !sessionData.token) {
                            showNotification('Error', 'Sesión inválida. Por favor, inicie sesión nuevamente.');
                            return;
                        }

                        const formData = new FormData(form);
                        const data = {
                            serviceName: formData.get('serviceName'),
                            url: formData.get('url'),
                            username: formData.get('username'),
                            password: formData.get('password')
                        };

                        // Validar datos requeridos
                        if (!data.serviceName || !data.password) {
                            showNotification('Error', 'El nombre del servicio y la contraseña son requeridos');
                            return;
                        }

                        console.log('Enviando datos:', data);
                        
                        const response = await fetch(`${API_URL}/passwords`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${sessionData.token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });
                        
                        if (!response.ok) {
                            if (response.status === 401) {
                                showNotification('Error', 'Sesión expirada. Por favor, inicie sesión nuevamente.');
                                window.location.href = 'index.html';
                                return;
                            }
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Error al guardar la contraseña');
                        }
                        
                        const newPassword = await response.json();
                        passwords.push(newPassword);
                        renderPasswords();
                        updateDashboardStats();
                        
                        // Cerrar modal y limpiar formulario
                        const modal = bootstrap.Modal.getInstance(addPasswordModal);
                        if (modal) modal.hide();
                        form.reset();
                        
                        showNotification('Éxito', 'Contraseña guardada correctamente');
                    } catch (error) {
                        console.error('Error al guardar contraseña:', error);
                        showNotification('Error', 'No se pudo guardar la contraseña: ' + error.message);
                    }
                };
            }
        });
    }

    // Actualizar estado de la billetera al cargar la página
    updateWalletStatus();
}); 
