// Configuración
const API_URL = 'http://localhost:3000/api';

// Elementos del DOM
const registerForm = document.getElementById('registerForm');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');

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
            // Guardar usuario y token
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                token: data.token
            }));
            
            alert('Registro exitoso');
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Error en el registro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
}); 