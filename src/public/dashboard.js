// Configuración
const API_URL = 'http://localhost:3000/api';

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

// Variables globales
let currentUser = null;
let passwords = [];
let scanner = null;

// Verificar autenticación
function checkAuth() {
    const sessionData = sessionStorage.getItem('currentSession');
    
    if (!sessionData) {
        window.location.href = 'index.html';
        return;
    }
    
    const session = JSON.parse(sessionData);
    currentUser = session.user;
    userName.textContent = currentUser.username;
    loadPasswords();
    updateLastAccess();
}

// Cargar contraseñas
async function loadPasswords() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
        console.log('Intentando cargar contraseñas con token:', sessionData.token);
        
        const response = await fetch(`${API_URL}/passwords`, {
            headers: {
                'Authorization': `Bearer ${sessionData.token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cargar contraseñas');
        }
        
        passwords = await response.json();
        console.log('Contraseñas cargadas:', passwords);
        renderPasswords();
        updateDashboardStats();
    } catch (error) {
        console.error('Error al cargar contraseñas:', error);
        showNotification('Error', 'No se pudieron cargar las contraseñas');
    }
}

// Renderizar contraseñas
function renderPasswords() {
    const tbody = recentPasswords;
    tbody.innerHTML = '';
    
    passwords.forEach(password => {
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
        tbody.appendChild(tr);
    });
}

// Actualizar estadísticas del dashboard
function updateDashboardStats() {
    totalPasswords.textContent = passwords.length;
    securityStatus.textContent = passwords.length > 0 ? 'Bueno' : 'Sin contraseñas';
}

// Actualizar último acceso
function updateLastAccess() {
    const now = new Date();
    lastAccess.textContent = now.toLocaleTimeString();
}

// Mostrar notificación
function showNotification(title, message) {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationModal.show();
}

// Mostrar contraseña
async function showPassword(id) {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
        const response = await fetch(`${API_URL}/passwords/${id}`, {
            headers: {
                'Authorization': `Bearer ${sessionData.token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al obtener la contraseña');
        
        const password = await response.json();
        showNotification('Contraseña', `La contraseña es: ${password.password}`);
    } catch (error) {
        showNotification('Error', 'No se pudo obtener la contraseña');
    }
}

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
            document.getElementById(sectionId).style.display = 'block';
            
            // Inicializar escáner QR si es necesario
            if (sectionId === 'qrSection') {
                initQRScanner();
            } else if (scanner) {
                scanner.stop();
            }
        });
    });
    
    // Toggle sidebar en móvil
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
    
    // Dark mode
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('bi-moon');
            icon.classList.add('bi-sun');
            localStorage.setItem('darkMode', 'true');
        } else {
            icon.classList.remove('bi-sun');
            icon.classList.add('bi-moon');
            localStorage.setItem('darkMode', 'false');
        }
    });
    
    // Cargar preferencias de tema
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.querySelector('i').classList.replace('bi-moon', 'bi-sun');
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
    
    // Cerrar sesión
    document.getElementById('sidebarLogoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentSession');
        window.location.href = 'index.html';
    });

    document.getElementById('menuLogoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentSession');
        window.location.href = 'index.html';
    });

    // Configuración
    document.getElementById('menuSettingsLink').addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        document.getElementById('settingsLink').classList.add('active');
        sections.forEach(section => section.style.display = 'none');
        document.getElementById('settingsSection').style.display = 'block';
    });

    // Event listeners para el formulario de contraseña
    generatePasswordBtn.addEventListener('click', () => {
        const passwordInput = passwordForm.querySelector('[name="password"]');
        passwordInput.value = generateSecurePassword();
    });

    togglePasswordBtn.addEventListener('click', () => {
        const passwordInput = passwordForm.querySelector('[name="password"]');
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePasswordBtn.querySelector('i').className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    });

    savePasswordBtn.addEventListener('click', async () => {
        const formData = new FormData(passwordForm);
        const data = {
            serviceName: formData.get('serviceName'),
            url: formData.get('url'),
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        try {
            const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
            const response = await fetch(`${API_URL}/passwords`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionData.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Error al guardar la contraseña');
            
            const newPassword = await response.json();
            passwords.push(newPassword);
            renderPasswords();
            
            // Cerrar modal y limpiar formulario
            bootstrap.Modal.getInstance(document.getElementById('addPasswordModal')).hide();
            passwordForm.reset();
            
            showNotification('Éxito', 'Contraseña guardada correctamente');
        } catch (error) {
            showNotification('Error', 'No se pudo guardar la contraseña');
        }
    });
}); 