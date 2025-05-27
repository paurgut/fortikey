// Configuración
const API_URL = 'https://fortikey.onrender.com/';

// Elementos del DOM
const registerForm = document.getElementById('registerForm');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');

// Función para mostrar notificaciones
function showNotification(title, message) {
    const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (notificationTitle) notificationTitle.textContent = title;
    if (notificationMessage) notificationMessage.textContent = message;
    if (notificationModal) notificationModal.show();
}

// Toggle password visibility
toggleRegisterPassword.addEventListener('click', () => {
    const passwordInput = document.getElementById('registerPassword');
    const icon = toggleRegisterPassword.querySelector('i');
    
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

// Registro de usuario
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    
    if (!username || !password) {
        showNotification('Error', 'Por favor, completa todos los campos');
        return;
    }

    try {
        // Registrar usuario
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el registro');
        }

        const userData = await response.json();
        
        // Guardar sesión
        sessionStorage.setItem('currentSession', JSON.stringify({
            user: userData.user,
            token: userData.token
        }));

        // Redirigir al dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Error en el registro:', error);
        showNotification('Error', error.message);
    }
}

registerForm.addEventListener('submit', handleRegister); 
