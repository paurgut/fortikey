// Configuración
const API_URL = 'https://fortikey.onrender.com/';

// Elementos del DOM
const newPasswordForm = document.getElementById('newPasswordForm');
const generatePasswordBtn = document.getElementById('generatePasswordBtn');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const userName = document.getElementById('userName');
const darkModeToggle = document.getElementById('darkModeToggle');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');

// Verificar autenticación
function checkAuth() {
    const sessionData = sessionStorage.getItem('currentSession');
    if (!sessionData) {
        window.location.href = 'index.html';
        return;
    }
    return JSON.parse(sessionData);
}

// Función global para cerrar sesión
window.logout = function() {
    console.log('Cerrando sesión...');
    sessionStorage.clear();
    window.location.href = 'index.html';
};

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

// Mostrar notificación
function showNotification(title, message) {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationModal.show();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const sessionData = checkAuth();
    if (!sessionData) return;

    // Actualizar nombre de usuario
    if (userName) {
        userName.textContent = sessionData.user.username;
    }

    // Toggle sidebar en móvil
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
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

    // Generar contraseña
    if (generatePasswordBtn) {
        generatePasswordBtn.addEventListener('click', () => {
            const passwordInput = newPasswordForm.querySelector('input[name="password"]');
            if (passwordInput) {
                passwordInput.value = generateSecurePassword();
                passwordInput.type = 'text';
                const icon = togglePasswordBtn.querySelector('i');
                if (icon) icon.className = 'bi bi-eye-slash';
            }
        });
    }

    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = newPasswordForm.querySelector('input[name="password"]');
            if (passwordInput) {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                const icon = togglePasswordBtn.querySelector('i');
                if (icon) icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
            }
        });
    }

    // Guardar contraseña
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(newPasswordForm);
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
                
                showNotification('Éxito', 'Contraseña guardada correctamente');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                console.error('Error al guardar contraseña:', error);
                showNotification('Error', 'No se pudo guardar la contraseña: ' + error.message);
            }
        });
    }
}); 
