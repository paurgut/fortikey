// Configuración
const API_URL = 'http://localhost:3000/api';

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
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar usuario y token
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                token: data.token
            }));
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert(data.error || 'Error en el inicio de sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
}); 