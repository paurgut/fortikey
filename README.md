# FortiKey - Gestor de Contraseñas Seguro

FortiKey es una aplicación web moderna para gestionar contraseñas de forma segura, con autenticación de usuarios y generación de tokens QR.

## Características

- Registro e inicio de sesión de usuarios
- Dashboard moderno con Bootstrap
- Gestión segura de contraseñas
- Escáner QR para importar contraseñas
- Modo oscuro
- Interfaz responsiva
- Almacenamiento seguro de datos
- Integración con contratos inteligentes en Starknet

## Requisitos

- Node.js (v14 o superior)
- npm o yarn
- Scarb (para contratos Cairo)

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd fortikey
```

2. Instalar dependencias del frontend:
```bash
npm install
```

3. Instalar dependencias de los contratos:
```bash
cd contracts
scarb build
cd ..
```

4. Iniciar el servidor:
```bash
npm run dev
```

## Estructura del Proyecto

```
fortikey/
├── src/
│   ├── index.js              # Servidor principal
│   └── public/              # Archivos del frontend
│       ├── index.html       # Página de login
│       ├── register.html    # Página de registro
│       ├── dashboard.html   # Panel principal
│       ├── styles.css       # Estilos globales
│       ├── login.js         # Lógica de login
│       ├── register.js      # Lógica de registro
│       └── dashboard.js     # Lógica del dashboard
├── contracts/               # Contratos Cairo
│   ├── src/
│   │   └── lib.cairo       # Contrato principal
│   ├── Scarb.toml          # Configuración de Scarb
│   └── Scarb.lock          # Lock file de dependencias
├── package.json
└── README.md
```

## Uso

### Registro de Usuario

1. Accede a la página de registro
2. Ingresa un nombre de usuario y contraseña
3. Se generará un token QR único para tu cuenta

### Inicio de Sesión

1. Accede a la página de inicio de sesión
2. Ingresa tus credenciales
3. Serás redirigido al dashboard

### Dashboard

- Ver estadísticas de tus contraseñas
- Agregar nuevas contraseñas
- Escanear códigos QR
- Gestionar configuraciones
- Activar/desactivar modo oscuro

## Contratos Cairo

Los contratos Cairo implementan la lógica de generación de tokens y verificación de identidad en la blockchain de Starknet.

## Licencia

Licencia de Software Propietario – FortiKey

Copyright © 2025 por FortiKey (https://github.com/paurgut)

Todos los derechos reservados.

Este software y todos sus archivos relacionados están protegidos por las leyes de derechos de autor internacionales. No se permite copiar, distribuir, modificar, sublicenciar, vender ni utilizar ninguna parte de este código fuente, ni su documentación, total o parcialmente, sin una autorización previa y expresa por escrito del titular de los derechos.

El uso no autorizado de este software puede resultar en acciones legales, incluyendo pero no limitado a sanciones civiles y penales.

Para obtener permisos especiales de uso, póngase en contacto con el autor o el equipo de FortiKey a través del repositorio oficial o por los medios autorizados.

Este software se proporciona “tal cual”, sin garantías de ningún tipo.

Fecha de última actualización: 27 de mayo de 2025