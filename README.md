# FortiKey - Sistema de Registro con Tokens QR

Este proyecto implementa un sistema de registro de usuarios que genera tokens QR únicos y los integra con un contrato Cairo en Starknet.

## Características

- Registro de usuarios
- Generación de tokens QR únicos
- Almacenamiento en JSON
- Integración con contrato Cairo en Starknet

## Requisitos

- Node.js (v14 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd fortikey
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor:
```bash
npm run dev
```

## Uso

### Registro de Usuario

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario1", "password": "contraseña123"}'
```

La respuesta incluirá un código QR único que representa el token del usuario.

## Estructura del Proyecto

```
fortikey/
├── src/
│   ├── index.js
│   └── data/
│       └── users.json
├── contracts/
│   └── mi_proyecto_cairo.cairo
├── package.json
└── README.md
```

## Contrato Cairo

El contrato Cairo implementa la generación de tokens únicos basados en el ID del usuario y el número de bloque actual.

## Licencia

MIT 