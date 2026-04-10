# 🔧 Gestor de Talleres Automotrices - Backend API

Backend robusto en Node.js para la gestión integral de talleres automotrices con arquitectura de capas, autenticación OAuth2/OIDC mediante Keycloak, base de datos Oracle DB y mensajería asincrónica con Apache Kafka.

## 📋 Descripción

Sistema empresarial completo para talleres de reparación y mantenimiento vehicular que permite:
- Gestión de clientes y vehículos
- Creación y seguimiento de órdenes de servicio
- Control de inventario de repuestos
- Registro de pagos y transacciones
- Historial de mantenimientos
- Reportes y análisis
- Auditoría de accesos y acciones
- Autenticación y autorización basada en roles

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Runtime** | Node.js | 16+ |
| **Framework Web** | Express.js | 4.18+ |
| **Base de Datos** | Oracle Database | 21c |
| **Driver Oracle** | oracledb | 6.3+ |
| **Autenticación** | Keycloak (OIDC) | 21+ |
| **JWT** | jsonwebtoken | 9.0+ |
| **Mensajería** | Apache Kafka | 7.4+ |
| **Validación** | Joi | 17.9+ |
| **Encriptación** | bcryptjs | 2.4+ |
| **Variables de Entorno** | dotenv | 16.3+ |
| **HTTP Client** | axios | 1.6+ |

---

## 🏗️ Arquitectura del Proyecto

```
GestorTalleresAutomotriz2/
├── app/
│   ├── main.js                      # Punto de entrada principal
│   ├── __init__.js                  # Inicialización
│   ├── producer.js                  # Productor de eventos Kafka
│   ├── api/
│   │   └── routes.js                # Enrutamiento principal
│   ├── controllers/                 # Control de solicitudes HTTP
│   │   ├── auth_controller.js
│   │   ├── clientes_controller.js
│   │   ├── vehiculos_controller.js
│   │   ├── ordenes_controller.js
│   │   ├── inventario_controller.js
│   │   ├── pagos_controller.js
│   │   ├── historial_controller.js
│   │   └── reportes_controller.js
│   ├── services/                    # Lógica de negocio
│   │   ├── auth_service.js
│   │   ├── clientes_service.js
│   │   └── ...
│   ├── repositories/                # Acceso a datos
│   │   ├── clientes_repository.js
│   │   └── ...
│   ├── entities/
│   │   └── models.js                # Modelos de datos
│   ├── schemas/                     # Validación (Joi)
│   │   ├── auth.js
│   │   ├── clientes.js
│   │   └── ...
│   ├── kafka/
│   │   └── producer.js              # Eventos Kafka
│   └── core/                        # Servicios centrales
│       ├── config.js                # Configuración
│       ├── database.js              # Conexión Oracle
│       ├── security.js              # Keycloak + JWT + Roles
│       └── ...
├── sql/
│   └── schema.sql                   # Script de base de datos Oracle
├── docker-compose.yml               # Servicios (Kafka, Zookeeper)
├── package.json                     # Dependencias
├── .env                             # Variables de entorno
└── README.md                        # Este archivo
```

### Patrones de Diseño Implementados

- **Arquitectura por Capas**: Controllers → Services → Repositories
- **Inversión de Control**: Inyección de dependencias en servicios
- **Middleware OIDC**: Validación de JWT y extracción de roles
- **Event-Driven**: Producción de eventos a Kafka para auditoría
- **Repository Pattern**: Abstracción de acceso a datos

---

## 📋 Requisitos Previos

### Sistema Requerido

- **Node.js** 16+
- **npm** o **yarn**
- **Oracle Database** 21c (acceso remoto o local)
- **Keycloak** 21+ (server remoto)
- **Apache Kafka** 7.4+ (para mensajería)
- **Docker** y **Docker Compose** (opcional, para Kafka local)
- **Git**

### Credenciales y Accesos Necesarios

1. **Oracle Database**
   - Host, puerto, usuario y contraseña
   
2. **Keycloak**
   - URL del servidor
   - Realm configurado
   - Client ID y Client Secret
   
3. **Apache Kafka**
   - Bootstrap servers
   - Topics creados (opcional, se crean automáticamente)

---

## 🚀 Instalación y Configuración

### 1. Clonar o descargar el repositorio

```bash
cd GestorTalleresAutomotriz2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear o actualizar el archivo `.env` en la raíz del proyecto:

```env
# Configuración de la Aplicación
APP_NAME=Gestor Taller Automotriz API
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# Configuración de Oracle Database
DATABASE_HOST=10.200.5.179
DATABASE_PORT=1521
DATABASE_USER=tallerautomotriz_oracledb
DATABASE_PASSWORD=S1lEN4cR8y
DATABASE_NAME=xe
DATABASE_URL=oracle+cx_oracle://tallerautomotriz_oracledb:S1lEN4cR8y@10.200.5.179:1521/xe

# Configuración de Keycloak (OIDC)
KEYCLOAK_SERVER_URL=http://10.200.5.179:8080
KEYCLOAK_REALM=Arquitectura
KEYCLOAK_CLIENT_ID=03
KEYCLOAK_CLIENT_SECRET=ZBK6hdJqZqAtf4dFla9YBthWgMQVrZqv
KEYCLOAK_AUDIENCE=account

# Configuración de Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_SECURITY=seguridad.accesos
```

### 4. Inicializar la Base de Datos Oracle

Ejecutar el script SQL en Oracle SQL Developer o herramienta similar:

```bash
# En Oracle SQL Developer o SQLPlus:
@sql/schema.sql
# O manualmente copiar y ejecutar el contenido de sql/schema.sql
```

Este script crea:
- Tabla `clientes`
- Tabla `vehiculos`
- Tabla `inventario`
- Tabla `movimientos_inventario`
- Tabla `ordenes`
- Tabla `orden_repuestos`
- Tabla `pagos`
- Tabla `historial_mantenimientos`
- Secuencias para IDs

### 5. Iniciar servicios (Kafka, Zookeeper)

#### Opción A: Con Docker Compose (Recomendado)

```bash
docker-compose up -d
```

Esto inicia:
- **Kafka**: en `localhost:9092`
- **Zookeeper**: en `localhost:2181`
- **Kafka UI**: en `http://localhost:8083`

#### Opción B: Conexión a Kafka remoto

Modificar `KAFKA_BROKERS` en `.env` con la dirección del servidor Kafka remoto.

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Salida esperada:
```
BD conectada
Productor de Kafka conectado
Servidor corriendo en 0.0.0.0:8000
```

---

## 🔐 Rol y Permisos en Keycloak

Configurar los siguientes roles en Keycloak > Realm > Roles:

### **1. Admin**
- Acceso completo a todos los módulos
- Crear, leer, actualizar, eliminar en cualquier entidad
- Gestión de usuarios y auditoría

| Permiso | Acceso |
|---------|--------|
| clientes:* | Total |
| vehiculos:* | Total |
| ordenes:* | Total |
| inventario:* | Total |
| pagos:* | Total |
| historial:* | Total |
| reportes:* | Total |
| usuarios:* | Total |

### **2. Recepcionista**
- Atención al cliente
- Registro de vehículos y órdenes

| Permiso | Acceso |
|---------|--------|
| clientes:create, read, update | ✅ |
| vehiculos:create, read, update | ✅ |
| ordenes:create, read, update | ✅ |
| inventario:read | ✅ |
| pagos:read | ✅ |
| reportes | ❌ |

### **3. Mecánico**
- Ejecución de servicios
- Actualización de órdenes y consumo de repuestos

| Permiso | Acceso |
|---------|--------|
| ordenes:read, update | ✅ |
| inventario:consume | ✅ |
| historial:create, read | ✅ |
| clientes:read | ✅ |

### **4. Almacenero**
- Control de inventario de repuestos

| Permiso | Acceso |
|---------|--------|
| inventario:* | Total |
| movimientos:* | Total |
| ordenes:read | ✅ |
| reportes:alertas_stock | ✅ |

### **5. Contador/Finanzas**
- Gestión de pagos y reportes financieros

| Permiso | Acceso |
|---------|--------|
| pagos:* | Total |
| ordenes:read | ✅ |
| clientes:read | ✅ |
| reportes:financieros | ✅ |

### **6. Gerente**
- Supervisión y análisis

| Permiso | Acceso |
|---------|--------|
| reportes:* | Total |
| ordenes:read | ✅ |
| historial:read | ✅ |
| clientes:read | ✅ |

---

## 🧪 Pruebas: Guía Completa

### **A. Pruebas con Keycloak**

#### 1. Obtener Token de Acceso

```bash
# Solicitar token al endpoint de login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario@ejemplo.com",
    "password": "password123"
  }'
```

**Respuesta exitosa:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

#### 2. Usar Token en Solicitudes

Incluir el token en el header `Authorization`:

```bash
curl -X GET http://localhost:8000/api/clientes \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 3. Verificar Roles Asignados

El middleware de seguridad extrae automáticamente roles del token JWT:

```javascript
// En security.js - la función extractRoles() obtiene:
// - realm_access.roles
// - resource_access[CLIENT_ID].roles
```

#### 4. Probar Autorización por Rol

**Crear cliente (requiere: admin o recepcionista)**
```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documento": "12345678",
    "nombre": "Juan Pérez",
    "telefono": "3001234567",
    "correo": "juan@ejemplo.com",
    "direccion": "Calle 10 #20-30"
  }'
```

**Eliminar cliente (requiere: admin)**
```bash
curl -X DELETE http://localhost:8000/api/clientes/cliente-uuid \
  -H "Authorization: Bearer <token>"
```

#### 5. Verificar Estado de Keycloak

```bash
curl http://localhost:8000/api/auth/keycloak/status
```

**Respuesta:**
```json
{
  "issuer": "http://10.200.5.179:8080/realms/Arquitectura",
  "token_endpoint": "http://10.200.5.179:8080/realms/Arquitectura/protocol/openid-connect/token",
  "status": "ok"
}
```

---

### **B. Pruebas con Base de Datos Oracle**

#### 1. Verificar Conexión

El servidor mostrará en logs:
```
BD conectada
```

Si hay error:
```
BD no disponible, continuando sin base de datos
```

#### 2. Crear Cliente

```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documento": "1000123456",
    "nombre": "Taller Los Andes",
    "telefono": "3115551234",
    "correo": "info@tallerlosandes.com",
    "direccion": "Calle 15 #45-67, Bogotá"
  }'
```

#### 3. Listar Clientes

```bash
curl http://localhost:8000/api/clientes \
  -H "Authorization: Bearer <token>"
```

#### 4. Obtener Cliente por ID

```bash
curl http://localhost:8000/api/clientes/cliente-uuid \
  -H "Authorization: Bearer <token>"
```

#### 5. Actualizar Cliente

```bash
curl -X PUT http://localhost:8000/api/clientes/cliente-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Taller Los Andes (Actualizado)",
    "telefono": "3115559999"
  }'
```

#### 6. Monitorear Consultas SQL

En Oracle SQL Developer:
```sql
-- Ver tablas creadas
SELECT table_name FROM user_tables;

-- Ver datos de clientes
SELECT * FROM clientes;

-- Ver datos de vehículos
SELECT * FROM vehiculos;

-- Ver órdenes
SELECT * FROM ordenes;
```

---

### **C. Pruebas con Kafka**

#### 1. Iniciar Kafka (si no está activo)

```bash
docker-compose up -d kafka zookeeper
```

#### 2. Acceder a Kafka UI

Abrir en navegador: `http://localhost:8083`

#### 3. Probar Evento de Auditoría

El sistema automáticamente registra eventos de acceso:

```bash
# Sin token (genera evento: acceso_sin_token)
curl http://localhost:8000/api/clientes

# Con token válido (genera evento: acceso_valido)
curl http://localhost:8000/api/clientes \
  -H "Authorization: Bearer <token>"
```

#### 4. Verificar Eventos en Kafka UI

1. Ir a: `http://localhost:8083`
2. Seleccionar topic: `seguridad.accesos`
3. Ver mensajes con estructura:
   ```json
   {
     "tipo": "acceso_valido",
     "usuario": "usuario@ejemplo.com",
     "endpoint": "/api/clientes"
   }
   ```

#### 5. Crear Eventos Personalizados

Endpoint de prueba Kafka:

```bash
curl http://localhost:8000/api/test-kafka \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Evento cliente_creado enviado a Kafka exitosamente",
  "event": {
    "tipo": "cliente_creado",
    "clienteId": "mock-12345",
    "usuario": "usuario@ejemplo.com"
  }
}
```

#### 6. Consumir Eventos desde Kafka (Node.js)

```javascript
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
  clientId: 'consumer-app',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'test-group' });

async function consumeMessages() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'seguridad.accesos' });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('Mensaje recibido:', JSON.parse(message.value.toString()));
    }
  });
}

consumeMessages().catch(console.error);
```

---

## 📡 Endpoints Disponibles

### Autenticación

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|----------------|
| POST | `/api/auth/login` | Obtener token JWT | ❌ |
| GET | `/api/auth/keycloak/status` | Verificar estado de Keycloak | ❌ |

### Clientes

| Método | Endpoint | Descripción | Roles Requeridos |
|--------|----------|-------------|------------------|
| GET | `/api/clientes` | Listar clientes | Cualquiera |
| GET | `/api/clientes/:id` | Obtener cliente | Cualquiera |
| POST | `/api/clientes` | Crear cliente | admin, recepcionista |
| PUT | `/api/clientes/:id` | Actualizar cliente | admin, recepcionista |
| DELETE | `/api/clientes/:id` | Eliminar cliente | admin |

### Vehículos

| Método | Endpoint | Descripción | Roles Requeridos |
|--------|----------|-------------|------------------|
| GET | `/api/vehiculos` | Listar vehículos | Cualquiera |
| GET | `/api/vehiculos/:placa` | Obtener vehículo | Cualquiera |
| POST | `/api/vehiculos` | Crear vehículo | admin, recepcionista |
| PUT | `/api/vehiculos/:placa` | Actualizar vehículo | admin, recepcionista |
| DELETE | `/api/vehiculos/:placa` | Eliminar vehículo | admin |

### Órdenes

| Método | Endpoint | Descripción | Roles Requeridos |
|--------|----------|-------------|------------------|
| GET | `/api/ordenes` | Listar órdenes | Cualquiera |
| GET | `/api/ordenes/resumen/estados` | Resumen de estados | admin, gerente |

### Inventario

| Método | Endpoint | Descripción | Roles Requeridos |
|--------|----------|-------------|------------------|
| GET | `/api/inventario` | Listar repuestos | Cualquiera |
| GET | `/api/inventario/movimientos` | Ver movimientos | admin, almacenero |
| GET | `/api/inventario/alertas` | Ver alertas de stock | almacenero, gerente |

### Pagos

| Método | Endpoint | Descripción | Roles Requeridos |
|--------|----------|-------------|------------------|
| GET | `/api/pagos` | Listar pagos | contador, admin |

### Historial

| Método | Endpoint | Descripción | Roles Requeridos |
|--------|----------|-------------|------------------|
| GET | `/api/historial` | Historial de vehículos | Cualquiera |
| GET | `/api/historial/vehiculo-completo` | Historial completo | admin, gerente |

### Reportes

| Método | Endpoint | Descripción | Roles Requeridos |
|--------|----------|-------------|------------------|
| GET | `/api/reportes/ingresos` | Reportes de ingresos | contador, gerente |
| GET | `/api/reportes/alertas-stock` | Alertas de inventario | almacenero, gerente |
| GET | `/api/reportes/ordenes` | Reportes de órdenes | admin, gerente |

### Sistema

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|----------------|
| GET | `/health` | Health check | ❌ |
| GET | `/api/test-kafka` | Prueba de Kafka | ✅ |
| GET | `/api/metrics` | Métricas del sistema | ✅ |

---

## 📊 Eventos de Auditoría (Kafka)

El sistema registra automáticamente los siguientes eventos en el topic `seguridad.accesos`:

### Evento: acceso_sin_token
```json
{
  "tipo": "acceso_sin_token",
  "endpoint": "/api/clientes",
  "ip": "192.168.1.100",
  "timestamp": "2024-04-09T10:30:00Z"
}
```

### Evento: acceso_valido
```json
{
  "tipo": "acceso_valido",
  "usuario": "usuario@ejemplo.com",
  "endpoint": "/api/clientes",
  "timestamp": "2024-04-09T10:30:05Z"
}
```

### Evento: cliente_creado
```json
{
  "tipo": "cliente_creado",
  "clienteId": "550e8400-e29b-41d4-a716-446655440000",
  "usuario": "recepcionista@ejemplo.com",
  "timestamp": "2024-04-09T10:30:10Z"
}
```

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo con auto-reload
npm run dev

# Iniciar en producción
npm start

# Instalar dependencias
npm install
```

---

## 📚 Estructura de Directorios Detallada

```
app/
├── main.js                           # Inicialización del servidor Express
├── producer.js                       # Productor Kafka para eventos
│
├── api/
│   └── routes.js                     # Rutas principales (enrutamiento)
│
├── controllers/                      # Controladores (HTTP request handlers)
│   ├── auth_controller.js            # Autenticación
│   ├── clientes_controller.js        # CRUD de clientes
│   ├── vehiculos_controller.js       # CRUD de vehículos
│   ├── ordenes_controller.js         # Gestión de órdenes
│   ├── inventario_controller.js      # Gestión de inventario
│   ├── pagos_controller.js           # Procesamiento de pagos
│   ├── historial_controller.js       # Historial de servicios
│   └── reportes_controller.js        # Generación de reportes
│
├── services/                         # Lógica de negocio
│   ├── auth_service.js               # Servicios de autenticación
│   ├── clientes_service.js           # Operaciones de clientes
│   └── ...
│
├── repositories/                     # Acceso a datos (DAO)
│   └── clientes_repository.js        # Consultas SQL de clientes
│
├── entities/                         # Modelos/entidades
│   └── models.js                     # Definición de entidades
│
├── schemas/                          # Validación de datos (Joi)
│   ├── auth.js                       # Validación de login
│   ├── clientes.js                   # Validación de clientes
│   └── ...
│
├── kafka/                            # Integración Kafka
│   └── producer.js                   # Productor de eventos
│
└── core/                             # Servicios centrales
    ├── config.js                     # Configuración (.env)
    ├── database.js                   # Conexión Oracle DB
    └── security.js                   # Keycloak + JWT + Roles
```

---

## 🚨 Solución de Problemas

### "BD no disponible, continuando sin base de datos"

**Problema**: No se puede conectar a Oracle Database

**Soluciones**:
1. Verificar credenciales en `.env`
2. Verificar que Oracle Database esté activo
3. Comprobar conectividad: `sqlplus usuario/contraseña@host:puerto/basedatos`

### "Token inválido o expirado"

**Problema**: Error 401 en endpoints protegidos

**Soluciones**:
1. Verificar que el token no haya expirado
2. Renovar con `/api/auth/login`
3. Verificar configuración de Keycloak (REALM, CLIENT_ID)

### "Productor de Kafka no conectado"

**Problema**: No se registran eventos de auditoría

**Soluciones**:
1. Iniciar Kafka: `docker-compose up -d kafka zookeeper`
2. Verificar `KAFKA_BROKERS` en `.env`
3. Revisar logs: `docker logs kafka`

### Error de CORS

**Problema**: `No 'Access-Control-Allow-Origin' header`

**Solución**: Agregar middleware CORS en `main.js`:
```javascript
app.use(cors({
  origin: '*', // O especificar dominios permitidos
  credentials: true
}));
```

---

## 📝 Ejemplos de Uso Completos

### Flujo Completo: Crear Orden de Servicio

```bash
# 1. Autenticarse
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"recepcionista","password":"pass"}' \
  | jq -r '.access_token')

# 2. Crear cliente
CLIENT=$(curl -s -X POST http://localhost:8000/api/clientes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documento":"1000","nombre":"Juan","telefono":"3001234567"}' \
  | jq -r '.id')

# 3. Crear vehículo
curl -s -X POST http://localhost:8000/api/vehiculos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"placa\":\"ABC123\",\"marca\":\"Toyota\",\"modelo\":\"Corolla\",\"cliente_id\":\"$CLIENT\"}"

# 4. Crear orden de servicio
curl -s -X POST http://localhost:8000/api/ordenes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"placa":"ABC123","diagnostico":"Revisión general"}'
```

---

## 📦 Dependencias Principales

```json
{
  "dependencies": {
    "express": "4.18.2",           // Framework web
    "oracledb": "6.3.0",            // Driver Oracle
    "jsonwebtoken": "9.0.2",        // Manejo de JWT
    "axios": "1.6.0",               // HTTP client
    "kafkajs": "2.2.4",             // Cliente Kafka
    "joi": "17.9.2",                // Validación de datos
    "bcryptjs": "2.4.3",            // Encriptación
    "dotenv": "16.3.1",             // Variables de entorno
    "uuid": "9.0.1"                 // Generación de UUIDs
  }
}
```

---

## 🔒 Buenas Prácticas de Seguridad

1. **Nunca** commitear `.env` con credenciales reales
2. Usar **HTTPS** en producción
3. Implementar **rate limiting** en endpoints públicos
4. Rotar **secrets** de Keycloak regularmente
5. Registrar y monitorear **eventos de seguridad** en Kafka
6. Usar **variables de entorno** para configuraciones sensibles
7. Validar **entrada de datos** con Joi schemas

---

## 👥 Contribuciones

Para contribuir al proyecto:
1. Crear rama: `git checkout -b feature/nueva-caracteristica`
2. Hacer cambios
3. Testear antes de commit
4. Enviar pull request

---

## 📄 Licencia

ISC

---

## 📞 Soporte

Para problemas o preguntas:
- Revisar logs: `docker logs` o salida de consola
- Verificar configuración `.env`
- Consultar endpoints en la sección [📡 Endpoints Disponibles](#-endpoints-disponibles)

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