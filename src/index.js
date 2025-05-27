const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'clave_secreta_fortikey';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Archivo de usuarios
const usersFile = path.join(__dirname, 'data', 'users.json');

// Crear archivo de usuarios si no existe
if (!fs.existsSync(path.dirname(usersFile))) {
    fs.mkdirSync(path.dirname(usersFile), { recursive: true });
}
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validar datos
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        // Leer usuarios existentes
        let users = [];
        try {
            users = JSON.parse(fs.readFileSync(usersFile));
        } catch (error) {
            users = [];
        }

        // Verificar si el usuario ya existe
        if (users.some(u => u.username === username)) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Crear nuevo usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            username,
            password: hashedPassword
        };

        // Guardar usuario
        users.push(newUser);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

        // Generar token
        const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);

        res.json({
            success: true,
            token,
            user: {
                id: newUser.id,
                username: newUser.username
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar datos
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        // Leer usuarios
        let users = [];
        try {
            users = JSON.parse(fs.readFileSync(usersFile));
        } catch (error) {
            users = [];
        }

        // Buscar usuario
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Generar token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
}); 