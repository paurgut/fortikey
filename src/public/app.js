// Configuración
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let qrScannerInstance = null;
let isAuthenticated = false;
let passwords = [];

// Elementos del DOM
const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');
const qrResult = document.getElementById('qrResult');
const qrCode = document.getElementById('qrCode');
const passwordForm = document.getElementById('passwordForm');
const passwordsList = document.getElementById('passwordsList');
const togglePassword = document.getElementById('togglePassword');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
const qrVideo = document.getElementById('qrVideo');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const navLinks = document.querySelectorAll('.nav-link');
const darkModeToggle = document.getElementById('darkModeToggle');
const searchInput = document.getElementById('searchInput');
const userDropdown = document.getElementById('userDropdown');
const userMenu = document.getElementById('userMenu');

// Navegación
document.getElementById('loginLink').addEventListener('click', () => showSection('loginSection'));
document.getElementById('registerLink').addEventListener('click', () => showSection('registerSection'));
document.getElementById('qrScannerLink').addEventListener('click', () => {
    if (!isAuthenticated) {
        showAlert('Por favor, inicia sesión primero', 'warning');
        showSection('loginSection');
    } else {
        showSection('qrScannerSection');
    }
});
document.getElementById('passwordsLink').addEventListener('click', () => {
    if (!isAuthenticated) {
        showAlert('Por favor, inicia sesión primero', 'warning');
        showSection('loginSection');
    } else {
        showSection('passwordsSection');
    }
});

// Funciones de navegación
function showAuthView() {
    authView.style.display = 'flex';
    dashboardView.style.display = 'none';
}

function showDashboardView() {
    authView.style.display = 'none';
    dashboardView.style.display = 'flex';
}

function showLoginForm() {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
}

function showRegisterForm() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
}

// Event Listeners para navegación
document.addEventListener('DOMContentLoaded', () => {
    // Enlaces de navegación
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    // Formulario de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!username || !password) {
            alert('Por favor, completa todos los campos');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = {
                    id: data.user.id,
                    username: data.user.username,
                    token: data.token
                };
                isAuthenticated = true;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                showDashboardView();
                loadPasswords();
                updateUserInfo();
                showAlert('Inicio de sesión exitoso', 'success');
            } else {
                showAlert(data.error || 'Error en el inicio de sesión', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error al conectar con el servidor', 'danger');
        }
    });

    // Formulario de registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        
        if (!username || !password) {
            alert('Por favor, completa todos los campos');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = {
                    id: data.user.id,
                    username: data.user.username,
                    token: data.token
                };
                isAuthenticated = true;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                showDashboardView();
                loadPasswords();
                updateUserInfo();
                showAlert('Registro exitoso', 'success');
            } else {
                showAlert(data.error || 'Error en el registro', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error al conectar con el servidor', 'danger');
        }
    });

    // Cerrar sesión
    document.getElementById('logoutLink').addEventListener('click', () => {
        currentUser = null;
        isAuthenticated = false;
        localStorage.removeItem('currentUser');
        showAuthView();
        showLoginForm();
    });

    // Verificar si hay un usuario guardado
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isAuthenticated = true;
            showDashboardView();
            loadPasswords();
            updateUserInfo();
        } catch (error) {
            console.error('Error:', error);
            localStorage.removeItem('currentUser');
            showAuthView();
            showLoginForm();
        }
    } else {
        showAuthView();
        showLoginForm();
    }
});

// Toggle password visibility
function setupPasswordToggle(button, inputId) {
    button.addEventListener('click', () => {
        const passwordInput = document.getElementById(inputId);
        const icon = button.querySelector('i');
        
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
}

setupPasswordToggle(toggleLoginPassword, 'loginPassword');
setupPasswordToggle(toggleRegisterPassword, 'password');
setupPasswordToggle(togglePassword, 'servicePassword');

// Funciones de navegación
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
    
    if (sectionId === 'qrScannerSection') {
        initializeQRScanner();
    }
}

// Manejo del escáner QR
async function initializeQRScanner() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        qrVideo.srcObject = stream;
        
        qrScannerInstance = new QRScanner(qrVideo, result => {
            if (result) {
                handleQRResult(result);
            }
        });
        
        qrScannerInstance.start();
    } catch (error) {
        console.error('Error al inicializar el escáner QR:', error);
        alert('Error al acceder a la cámara');
    }
}

// Manejo de QR escaneado
async function onQRCodeScanned(decodedText) {
    try {
        const qrData = JSON.parse(decodedText);
        currentUser = qrData;
        isAuthenticated = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        qrScannerInstance.stop();
        showSection('passwordsSection');
        loadPasswords();
        showAlert('QR escaneado correctamente', 'success');
    } catch (error) {
        console.error('Error al procesar QR:', error);
        showAlert('QR inválido o corrupto', 'danger');
    }
}

// Función para cifrar datos con AES-256
function encryptData(data, key) {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    const key256 = CryptoJS.PBKDF2(key, salt, {
        keySize: 256/32,
        iterations: 1000
    });
    
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key256, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });
    
    return {
        salt: salt.toString(),
        iv: iv.toString(),
        data: encrypted.toString()
    };
}

// Función para descifrar datos con AES-256
function decryptData(encryptedData, key) {
    try {
        // Si es una contraseña antigua (sin el nuevo formato)
        if (typeof encryptedData === 'string') {
            return {
                url: 'N/A',
                username: 'N/A',
                password: CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8)
            };
        }

        // Si es una contraseña nueva (con el nuevo formato)
        if (encryptedData && encryptedData.salt && encryptedData.iv && encryptedData.data) {
            const key256 = CryptoJS.PBKDF2(key, CryptoJS.enc.Hex.parse(encryptedData.salt), {
                keySize: 256/32,
                iterations: 1000
            });
            
            const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key256, {
                iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });
            
            return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
        }

        throw new Error('Formato de datos inválido');
    } catch (error) {
        console.error('Error al descifrar datos:', error);
        return {
            url: 'Error',
            username: 'Error',
            password: 'Error al descifrar'
        };
    }
}

// Gestión de contraseñas
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
        showAlert('Debes escanear tu QR primero', 'warning');
        return;
    }
    
    const serviceUrl = document.getElementById('serviceUrl').value.trim();
    const serviceName = document.getElementById('serviceName').value.trim();
    const serviceUsername = document.getElementById('serviceUsername').value.trim();
    const servicePassword = document.getElementById('servicePassword').value.trim();
    
    if (!serviceUrl || !serviceName || !serviceUsername || !servicePassword) {
        showAlert('Por favor, completa todos los campos', 'warning');
        return;
    }
    
    try {
        const passwordData = {
            url: serviceUrl,
            username: serviceUsername,
            password: servicePassword
        };
        
        // Cifrar los datos usando AES-256
        const encryptedData = encryptData(passwordData, currentUser.token);
        
        // Guardar en localStorage
        passwords.push({
            service: serviceName,
            data: encryptedData,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('passwords', JSON.stringify(passwords));
        
        // Limpiar formulario y actualizar lista
        passwordForm.reset();
        loadPasswords();
        showAlert('Contraseña guardada', 'success');
    } catch (error) {
        console.error('Error al guardar contraseña:', error);
        showAlert('Error al guardar la contraseña', 'danger');
    }
});

// Cargar contraseñas
function loadPasswords() {
    if (!isAuthenticated) return;
    
    try {
        passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
        passwordsList.innerHTML = '';
        
        passwords.forEach((item, index) => {
            try {
                const decryptedData = decryptData(item.data || item.password, currentUser.token);
                
                const passwordItem = document.createElement('div');
                passwordItem.className = 'password-item fade-in';
                passwordItem.innerHTML = `
                    <div class="service-info">
                        <h5>${item.service}</h5>
                        <div class="service-details">
                            <div><strong>URL:</strong> <a href="${decryptedData.url}" target="_blank">${decryptedData.url}</a></div>
                            <div><strong>Usuario:</strong> ${decryptedData.username}</div>
                            <div class="password-container">
                                <strong>Contraseña:</strong>
                                <div class="password-display">
                                    <span class="password-text" data-password="${decryptedData.password}">••••••••</span>
                                    <button class="btn btn-sm btn-link toggle-password" onclick="togglePasswordDisplay(this)">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="password-actions">
                        <button class="btn btn-sm btn-outline-primary btn-copy" onclick="copyToClipboard('${decryptedData.password}')">
                            <i class="bi bi-clipboard"></i> Copiar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePassword(${index})">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                passwordsList.appendChild(passwordItem);
            } catch (error) {
                console.error('Error al descifrar contraseña:', error);
            }
        });
    } catch (error) {
        console.error('Error al cargar contraseñas:', error);
        showAlert('Error al cargar las contraseñas', 'danger');
    }
}

// Toggle password display
function togglePasswordDisplay(button) {
    const passwordContainer = button.closest('.password-display');
    const passwordText = passwordContainer.querySelector('.password-text');
    const icon = button.querySelector('i');
    
    if (passwordText.textContent === '••••••••') {
        passwordText.textContent = passwordText.dataset.password;
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        passwordText.textContent = '••••••••';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
}

// Funciones auxiliares
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container').insertBefore(
        alertDiv,
        document.querySelector('.section')
    );
    
    setTimeout(() => alertDiv.remove(), 5000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Contraseña copiada al portapapeles', 'success');
    }).catch(error => {
        console.error('Error al copiar:', error);
        showAlert('Error al copiar la contraseña', 'danger');
    });
}

function deletePassword(index) {
    try {
        passwords.splice(index, 1);
        localStorage.setItem('passwords', JSON.stringify(passwords));
        loadPasswords();
        showAlert('Contraseña eliminada', 'success');
    } catch (error) {
        console.error('Error al eliminar contraseña:', error);
        showAlert('Error al eliminar la contraseña', 'danger');
    }
}

function updateNavigation() {
    const authLinks = document.querySelectorAll('.auth-link');
    const protectedLinks = document.querySelectorAll('.protected-link');
    
    if (isAuthenticated) {
        authLinks.forEach(link => link.style.display = 'none');
        protectedLinks.forEach(link => link.style.display = 'block');
        showSection('dashboardSection');
    } else {
        authLinks.forEach(link => link.style.display = 'block');
        protectedLinks.forEach(link => link.style.display = 'none');
        showSection('loginSection');
    }
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('lastAccess').textContent = new Date().toLocaleString();
        document.getElementById('passwordsCount').textContent = passwords.length;
    }
}

function handleQRResult(result) {
    try {
        const data = JSON.parse(result);
        if (data.type === 'password') {
            document.getElementById('serviceName').value = data.serviceName || '';
            document.getElementById('serviceUrl').value = data.serviceUrl || '';
            document.getElementById('serviceUsername').value = data.serviceUsername || '';
            document.getElementById('password').value = data.password || '';
        } else {
            alert('QR inválido');
        }
    } catch (error) {
        console.error('Error al procesar QR:', error);
        alert('Error al procesar el código QR');
    }
}

// Event Listeners
document.getElementById('qrLink').addEventListener('click', () => {
    showSection('qrSection');
    initializeQRScanner();
});

document.getElementById('settingsLink').addEventListener('click', () => showSection('settingsSection'));

searchInput.addEventListener('input', displayPasswords);

passwordsList.addEventListener('click', async (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    
    if (target.classList.contains('toggle-password')) {
        const passwordText = target.previousElementSibling;
        const password = target.dataset.password;
        
        if (passwordText.textContent === '••••••••') {
            passwordText.textContent = password;
            target.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
            passwordText.textContent = '••••••••';
            target.innerHTML = '<i class="bi bi-eye"></i>';
        }
    } else if (target.classList.contains('copy-password')) {
        const password = target.dataset.password;
        await navigator.clipboard.writeText(password);
        showAlert('Contraseña copiada al portapapeles', 'success');
    } else if (target.classList.contains('delete-password')) {
        const id = parseInt(target.dataset.id);
        const filteredPasswords = passwords.filter(pwd => pwd.id !== id);
        localStorage.setItem('passwords', JSON.stringify(filteredPasswords));
        loadPasswords();
        updateUserInfo();
    }
});

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

userDropdown.addEventListener('click', () => {
    userMenu.classList.toggle('show');
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            isAuthenticated = true;
            loadPasswords();
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            localStorage.removeItem('currentUser');
        }
    }
    
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    updateNavigation();
    updateUserInfo();
}); 