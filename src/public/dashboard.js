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
const passwordForm = document.getElementById('passwordForm');

// Variables globales
let currentUser = null;
let passwords = [];
let scanner = null;

// Verificar autenticación
function checkAuth() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    userName.textContent = currentUser.username;
    loadPasswords();
    updateLastAccess();
}

// Cargar contraseñas
async function loadPasswords() {
    try {
        const response = await fetch(`${API_URL}/passwords`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (response.ok) {
            passwords = await response.json();
            updatePasswordsList();
            updateDashboardStats();
        } else {
            throw new Error('Error al cargar contraseñas');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar las contraseñas');
    }
}

// Actualizar lista de contraseñas
function updatePasswordsList() {
    // Actualizar tabla de contraseñas recientes
    recentPasswords.innerHTML = passwords
        .slice(0, 5)
        .map(password => `
            <tr>
                <td>${password.serviceName}</td>
                <td>${password.username}</td>
                <td>${new Date(password.updatedAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewPassword('${password.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePassword('${password.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `)
        .join('');
    
    // Actualizar lista completa de contraseñas
    passwordsList.innerHTML = passwords
        .map(password => `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${password.serviceName}</h5>
                        <p class="card-text">
                            <strong>Usuario:</strong> ${password.username}<br>
                            <strong>URL:</strong> ${password.url || 'No especificada'}<br>
                            <strong>Última actualización:</strong> ${new Date(password.updatedAt).toLocaleDateString()}
                        </p>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewPassword('${password.id}')">
                                <i class="bi bi-eye"></i> Ver
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deletePassword('${password.id}')">
                                <i class="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `)
        .join('');
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

// Ver contraseña
async function viewPassword(id) {
    const password = passwords.find(p => p.id === id);
    if (!password) return;
    
    try {
        const response = await fetch(`${API_URL}/passwords/${id}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            alert(`Contraseña: ${data.password}`);
        } else {
            throw new Error('Error al obtener la contraseña');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al obtener la contraseña');
    }
}

// Eliminar contraseña
async function deletePassword(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta contraseña?')) return;
    
    try {
        const response = await fetch(`${API_URL}/passwords/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (response.ok) {
            passwords = passwords.filter(p => p.id !== id);
            updatePasswordsList();
            updateDashboardStats();
        } else {
            throw new Error('Error al eliminar la contraseña');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la contraseña');
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
    
    // Formulario de contraseña
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceName = document.getElementById('serviceName').value.trim();
        const serviceUrl = document.getElementById('serviceUrl').value.trim();
        const serviceUsername = document.getElementById('serviceUsername').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!serviceName || !password) {
            alert('Por favor, completa los campos requeridos');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/passwords`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({
                    serviceName,
                    url: serviceUrl,
                    username: serviceUsername,
                    password
                })
            });
            
            if (response.ok) {
                const newPassword = await response.json();
                passwords.unshift(newPassword);
                updatePasswordsList();
                updateDashboardStats();
                
                // Cerrar modal y limpiar formulario
                const modal = bootstrap.Modal.getInstance(document.getElementById('addPasswordModal'));
                modal.hide();
                passwordForm.reset();
            } else {
                throw new Error('Error al guardar la contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar la contraseña');
        }
    });
    
    // Cerrar sesión
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}); 