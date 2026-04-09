// Modelos para Oracle DB
// Usando consultas SQL directas

const { getConnection } = require('../core/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async executeQuery(sql, binds = []) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(sql, binds, { autoCommit: true });
      return result;
    } finally {
      await connection.close();
    }
  }
}

class Cliente extends BaseModel {
  constructor() {
    super('clientes');
  }

  async findAll() {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY fecha_registro DESC`;
    const result = await this.executeQuery(sql);
    return result.rows;
  }

  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = :id`;
    const result = await this.executeQuery(sql, [id]);
    return result.rows[0];
  }

  async create(data) {
    const sql = `INSERT INTO ${this.tableName} (id, documento, nombre, telefono, correo, direccion, fecha_registro) VALUES (:id, :documento, :nombre, :telefono, :correo, :direccion, SYSDATE)`;
    await this.executeQuery(sql, [data.id, data.documento, data.nombre, data.telefono, data.correo, data.direccion]);
    return data;
  }

  async update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = :${key}`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${fields} WHERE id = :id`;
    const binds = { ...data, id };
    await this.executeQuery(sql, binds);
    return { id, ...data };
  }

  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = :id`;
    await this.executeQuery(sql, [id]);
  }
}

// Similar para otros modelos...

class Vehiculo extends BaseModel {
  constructor() {
    super('vehiculos');
  }

  async findAll() {
    const sql = `SELECT * FROM ${this.tableName}`;
    const result = await this.executeQuery(sql);
    return result.rows;
  }

  async findByPlaca(placa) {
    const sql = `SELECT * FROM ${this.tableName} WHERE placa = :placa`;
    const result = await this.executeQuery(sql, [placa]);
    return result.rows[0];
  }

  async create(data) {
    const sql = `INSERT INTO ${this.tableName} (placa, marca, modelo, color, cliente_id) VALUES (:placa, :marca, :modelo, :color, :cliente_id)`;
    await this.executeQuery(sql, [data.placa, data.marca, data.modelo, data.color, data.cliente_id]);
    return data;
  }

  async update(placa, data) {
    const fields = Object.keys(data).map(key => `${key} = :${key}`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${fields} WHERE placa = :placa`;
    const binds = { ...data, placa };
    await this.executeQuery(sql, binds);
    return { placa, ...data };
  }

  async delete(placa) {
    const sql = `DELETE FROM ${this.tableName} WHERE placa = :placa`;
    await this.executeQuery(sql, [placa]);
  }
}

// Continuar con Inventario, Orden, etc.
// Para brevedad, definir solo los básicos y asumir el patrón

class Inventario extends BaseModel {
  constructor() {
    super('inventario');
  }

  async findAll() {
    const sql = `SELECT * FROM ${this.tableName}`;
    const result = await this.executeQuery(sql);
    return result.rows;
  }

  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = :id`;
    const result = await this.executeQuery(sql, [id]);
    return result.rows[0];
  }

  async create(data) {
    const sql = `INSERT INTO ${this.tableName} (id, nombre_repuesto, stock_actual, stock_minimo, precio_venta, proveedor) VALUES (:id, :nombre_repuesto, :stock_actual, :stock_minimo, :precio_venta, :proveedor)`;
    await this.executeQuery(sql, [data.id, data.nombre_repuesto, data.stock_actual, data.stock_minimo, data.precio_venta, data.proveedor]);
    return data;
  }

  async update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = :${key}`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${fields} WHERE id = :id`;
    const binds = { ...data, id };
    await this.executeQuery(sql, binds);
    return { id, ...data };
  }

  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = :id`;
    await this.executeQuery(sql, [id]);
  }
}

// Similar para Orden, Pago, HistorialMantenimiento, etc.

module.exports = { Cliente, Vehiculo, Inventario };