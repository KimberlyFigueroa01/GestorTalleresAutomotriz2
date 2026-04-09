# GestorTalleresAutomotrices

Backend en Node.js para gestión de talleres automotrices con arquitectura por capas:

- controllers
- services
- repositories
- entities
- schemas

Incluye autenticación con Keycloak usando access token y validación de roles.

## Stack

- Express.js
- Oracle DB
- Keycloak (OIDC)

## Estructura

app/
- api/
- controllers/
- core/
- entities/
- repositories/
- schemas/
- services/

sql/
- schema.sql

## Configuración

1. Instalar dependencias:

   npm install

2. Crear archivo .env a partir de .env.example y ajustar valores.

3. Crear base de datos y ejecutar script:

   (Usar SQL Developer o similar para ejecutar schema.sql en Oracle)

4. Iniciar servidor:

   npm run dev

## Keycloak

Variables necesarias:

- KEYCLOAK_SERVER_URL
- KEYCLOAK_REALM
- KEYCLOAK_CLIENT_ID
- KEYCLOAK_CLIENT_SECRET
- KEYCLOAK_AUDIENCE (opcional)

## Flujo de autenticación

1. POST /auth/login con username y password
2. Obtener access_token
3. Enviar Authorization: Bearer <token> en todas las rutas protegidas
4. El middleware valida token y roles

## Roles sugeridos

- admin
- recepcionista
- mecanico
- almacen
- cajero
- gerencia

## Endpoints principales

- Auth: /auth/login, /auth/keycloak/status
- Clientes: /clientes
- Vehiculos: /vehiculos
- Inventario: /inventario, /inventario/movimientos, /inventario/alertas
- Ordenes: /ordenes, /ordenes/repuestos, /ordenes/resumen/estados
- Pagos: /pagos
- Historial: /historial, /historial/vehiculo-completo
- Reportes: /reportes/ingresos, /reportes/alertas-stock, /reportes/ordenes

## Nota

El servidor puede iniciar incluso si Keycloak no responde en startup. En ese caso, las rutas protegidas devolverán error hasta que Keycloak esté disponible.