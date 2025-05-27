const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'clave_secreta_fortikey';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Archivos de datos
const usersFile = path.join(__dirname, 'data', 'users.json');
const passwordsFile = path.join(__dirname, 'data', 'passwords.json');

// Crear directorio de datos si no existe
if (!fs.existsSync(path.dirname(usersFile))) {
    fs.mkdirSync(path.dirname(usersFile), { recursive: true });
}

// Crear archivos si no existen
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}
if (!fs.existsSync(passwordsFile)) {
    fs.writeFileSync(passwordsFile, JSON.stringify([]));
}

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Función para encriptar contraseña
function encryptPassword(password, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Función para desencriptar contraseña
function decryptPassword(encrypted, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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

        // Generar token con el ID correcto
        const token = jwt.sign({ 
            id: user.id,  // Asegurarnos de usar el ID del usuario
            username: user.username 
        }, JWT_SECRET);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,  // Enviar el ID correcto
                username: user.username
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Rutas de contraseñas
app.get('/api/passwords', authenticateToken, (req, res) => {
    try {
        console.log('Usuario autenticado:', req.user);
        
        let passwords = [];
        try {
            passwords = JSON.parse(fs.readFileSync(passwordsFile));
            console.log('Contraseñas cargadas:', passwords);
        } catch (error) {
            console.error('Error al leer passwords.json:', error);
            passwords = [];
        }

        // Filtrar contraseñas del usuario actual
        const userPasswords = passwords.filter(p => p.userId === req.user.id);
        console.log('Contraseñas filtradas para usuario:', userPasswords);
        
        // Remover las contraseñas encriptadas de la respuesta
        const safePasswords = userPasswords.map(p => ({
            id: p.id,
            serviceName: p.serviceName,
            url: p.url,
            username: p.username,
            updatedAt: p.updatedAt
        }));

        res.json(safePasswords);
    } catch (error) {
        console.error('Error al obtener contraseñas:', error);
        res.status(500).json({ error: 'Error al obtener contraseñas' });
    }
});

app.get('/api/passwords/:id', authenticateToken, (req, res) => {
    try {
        let passwords = [];
        try {
            passwords = JSON.parse(fs.readFileSync(passwordsFile));
        } catch (error) {
            passwords = [];
        }

        const password = passwords.find(p => p.id === req.params.id && p.userId === req.user.id);
        if (!password) {
            return res.status(404).json({ error: 'Contraseña no encontrada' });
        }

        // Desencriptar contraseña
        const decryptedPassword = decryptPassword(password.encryptedPassword, JWT_SECRET);

        res.json({
            id: password.id,
            serviceName: password.serviceName,
            url: password.url,
            username: password.username,
            password: decryptedPassword,
            updatedAt: password.updatedAt
        });
    } catch (error) {
        console.error('Error al obtener contraseña:', error);
        res.status(500).json({ error: 'Error al obtener contraseña' });
    }
});

app.post('/api/passwords', authenticateToken, (req, res) => {
    try {
        const { serviceName, url, username, password } = req.body;
        console.log('Creando nueva contraseña para usuario:', req.user.id);

        // Validar datos
        if (!serviceName || !password) {
            return res.status(400).json({ error: 'Nombre del servicio y contraseña son requeridos' });
        }

        let passwords = [];
        try {
            passwords = JSON.parse(fs.readFileSync(passwordsFile));
        } catch (error) {
            console.error('Error al leer passwords.json:', error);
            passwords = [];
        }

        // Encriptar contraseña
        const encryptedPassword = encryptPassword(password, JWT_SECRET);

        // Crear nueva contraseña
        const newPassword = {
            id: Date.now().toString(),
            userId: req.user.id,
            serviceName,
            url: url || '',
            username: username || '',
            encryptedPassword,
            updatedAt: new Date().toISOString()
        };

        // Guardar contraseña
        passwords.push(newPassword);
        fs.writeFileSync(passwordsFile, JSON.stringify(passwords, null, 2));

        // Devolver contraseña sin datos sensibles
        res.json({
            id: newPassword.id,
            serviceName: newPassword.serviceName,
            url: newPassword.url,
            username: newPassword.username,
            updatedAt: newPassword.updatedAt
        });
    } catch (error) {
        console.error('Error al crear contraseña:', error);
        res.status(500).json({ error: 'Error al crear contraseña' });
    }
});

app.delete('/api/passwords/:id', authenticateToken, (req, res) => {
    try {
        console.log('Eliminando contraseña:', req.params.id, 'para usuario:', req.user.id);
        
        let passwords = [];
        try {
            passwords = JSON.parse(fs.readFileSync(passwordsFile));
        } catch (error) {
            console.error('Error al leer passwords.json:', error);
            return res.status(500).json({ error: 'Error al leer contraseñas' });
        }

        // Encontrar índice de la contraseña
        const passwordIndex = passwords.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
        if (passwordIndex === -1) {
            return res.status(404).json({ error: 'Contraseña no encontrada' });
        }

        // Eliminar contraseña
        passwords.splice(passwordIndex, 1);
        fs.writeFileSync(passwordsFile, JSON.stringify(passwords, null, 2));

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar contraseña:', error);
        res.status(500).json({ error: 'Error al eliminar contraseña' });
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