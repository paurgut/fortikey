// Configuración
const API_URL = 'https://fortikey.onrender.com/';

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');

// Toggle password visibility
toggleLoginPassword.addEventListener('click', () => {
    const passwordInput = document.getElementById('loginPassword');
    const icon = toggleLoginPassword.querySelector('i');
    
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

// Login de usuario
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    try {
        console.log('Intentando iniciar sesión...');
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en el inicio de sesión');
        }
        
        if (data.success && data.token && data.user) {
            // Guardar sesión
            const sessionData = {
                user: {
                    id: data.user.id,
                    username: data.user.username
                },
                token: data.token
            };
            
            sessionStorage.setItem('currentSession', JSON.stringify(sessionData));
            console.log('Sesión guardada correctamente');
            
            // Redirigir al dashboard
            window.location.replace('dashboard.html');
        } else {
            throw new Error('Datos de sesión incompletos');
        }
    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        alert(error.message || 'Error al conectar con el servidor');
    }
}); 
