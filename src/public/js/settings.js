// Configuración
const API_URL = 'https://fortikey.onrender.com/api';

// Elementos del DOM
const darkModeSwitch = document.getElementById('darkModeSwitch');
const notificationsSwitch = document.getElementById('notificationsSwitch');
const settingsForm = document.getElementById('settingsForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const userName = document.getElementById('userName');

// Verificar autenticación
function checkAuth() {
    const sessionData = sessionStorage.getItem('currentSession');
    
    if (!sessionData) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const session = JSON.parse(sessionData);
        if (userName) userName.textContent = session.user.username;
        loadSettings();
    } catch (error) {
        console.error('Error al cargar la sesión:', error);
        window.location.href = 'index.html';
    }
}

// Cargar configuración
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings')) || {
        darkMode: false,
        notifications: true
    };
    
    if (darkModeSwitch) darkModeSwitch.checked = settings.darkMode;
    if (notificationsSwitch) notificationsSwitch.checked = settings.notifications;
}

// Guardar configuración
function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
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

// Función global para cerrar sesión
window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Guardar configuración
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = {
                darkMode: darkModeSwitch.checked,
                notifications: notificationsSwitch.checked
            };
            saveSettings(settings);
            showNotification('Éxito', 'Configuración guardada correctamente');
        });
    }
    
    // Cambiar contraseña
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(changePasswordForm);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');
            
            if (newPassword !== confirmPassword) {
                showNotification('Error', 'Las contraseñas no coinciden');
                return;
            }
            
            try {
                const sessionData = JSON.parse(sessionStorage.getItem('currentSession'));
                const response = await fetch(`${API_URL}/users/change-password`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sessionData.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Error al cambiar la contraseña');
                }
                
                showNotification('Éxito', 'Contraseña cambiada correctamente');
                changePasswordForm.reset();
            } catch (error) {
                showNotification('Error', error.message);
            }
        });
    }
}); 
