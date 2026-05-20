-- Esquema Oracle alineado con la base de datos del taller

CREATE TABLE clientes (
    documento VARCHAR2(20) PRIMARY KEY,
    nombre VARCHAR2(100) NOT NULL,
    telefono VARCHAR2(15),
    correo VARCHAR2(100),
    direccion CLOB,
    comuna VARCHAR2(100),
    ciudad VARCHAR2(100),
    fecha_registro TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE vehiculos (
    placa VARCHAR2(10) PRIMARY KEY,
    marca VARCHAR2(50) NOT NULL,
    modelo VARCHAR2(50),
    color VARCHAR2(30),
    cliente_documento VARCHAR2(20) REFERENCES clientes(documento) ON DELETE CASCADE,
    ano NUMBER(4),
    tipo VARCHAR2(30),
    vin VARCHAR2(50),
    km NUMBER(10)
);

CREATE TABLE inventario (
    id NUMBER PRIMARY KEY,
    nombre_repuesto VARCHAR2(100) NOT NULL,
    sku VARCHAR2(50),
    categoria VARCHAR2(80),
    ubicacion VARCHAR2(50),
    stock_actual NUMBER DEFAULT 0,
    stock_minimo NUMBER DEFAULT 5,
    stock_maximo NUMBER(6),
    precio_compra NUMBER(12,2),
    precio_venta NUMBER(12,2) NOT NULL,
    proveedor VARCHAR2(100)
);

CREATE SEQUENCE inventario_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE movimientos_inventario (
    id NUMBER PRIMARY KEY,
    repuesto_id NUMBER REFERENCES inventario(id),
    tipo_movimiento VARCHAR2(10) NOT NULL,
    cantidad NUMBER NOT NULL,
    fecha TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE SEQUENCE movimientos_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE ordenes (
    id NUMBER PRIMARY KEY,
    placa_vehiculo VARCHAR2(10) REFERENCES vehiculos(placa),
    diagnostico CLOB,
    trabajo_realizado CLOB,
    estado VARCHAR2(20) DEFAULT 'Diagnostico',
    mecanico_asignado RAW(16),
    fecha_ingreso TIMESTAMP DEFAULT SYSTIMESTAMP,
    fecha_entrega TIMESTAMP,
    numero VARCHAR2(20),
    tipo_servicio VARCHAR2(20),
    descripcion CLOB,
    prioridad VARCHAR2(20),
    lineas CLOB,
    inventario_vehiculo CLOB,
    kilometraje NUMBER(10),
    nivel_combustible NUMBER(3),
    estado_vehiculo CLOB,
    notas CLOB,
    tareas CLOB,
    subtotal NUMBER(12,2),
    descuento NUMBER(12,2),
    iva NUMBER(12,2),
    total NUMBER(12,2),
    tecnico_asignado CLOB
);

CREATE SEQUENCE ordenes_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE orden_repuestos (
    id NUMBER PRIMARY KEY,
    orden_id NUMBER REFERENCES ordenes(id),
    repuesto_id NUMBER REFERENCES inventario(id),
    cantidad NUMBER DEFAULT 1
);

CREATE SEQUENCE orden_repuestos_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE pagos (
    id NUMBER PRIMARY KEY,
    orden_id NUMBER REFERENCES ordenes(id),
    monto_total NUMBER(12,2) NOT NULL,
    metodo_pago VARCHAR2(50),
    referencia VARCHAR2(50),
    fecha_pago TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE SEQUENCE pagos_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE historial_mantenimientos (
    id NUMBER PRIMARY KEY,
    placa_vehiculo VARCHAR2(10) REFERENCES vehiculos(placa) ON DELETE CASCADE,
    orden_id NUMBER REFERENCES ordenes(id),
    kilometraje_actual NUMBER,
    servicio_realizado VARCHAR2(255) NOT NULL,
    observaciones_tecnicas CLOB,
    fecha_servicio TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE SEQUENCE historial_seq START WITH 1 INCREMENT BY 1;
