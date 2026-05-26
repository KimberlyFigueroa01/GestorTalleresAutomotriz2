const oracledb = require('oracledb');
const { getConnection } = require('../core/database');
const { parseJsonValue, stringifyJsonValue } = require('../core/row_utils');

const ORDEN_JSON_FIELDS = [
  'lineas',
  'inventario_vehiculo',
  'notas',
  'tareas',
  'tecnico_asignado',
];

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async executeQuery(sql, binds = {}) {
    const connection = await getConnection();
    try {
      return await connection.execute(sql, binds, {
        autoCommit: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
    } finally {
      await connection.close();
    }
  }

  async readLob(lob) {
    return new Promise((resolve, reject) => {
      let data = '';
      lob.setEncoding('utf8');
      lob.on('data', (chunk) => { data += chunk; });
      lob.on('end', () => resolve(data));
      lob.on('error', reject);
    });
  }

  async processRows(rows, jsonFields = []) {
    if (!rows) return [];
    const processed = [];
    for (const row of rows) {
      const processedRow = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase();
        if (value && typeof value === 'object' && value.constructor?.name === 'Lob') {
          processedRow[lowerKey] = await this.readLob(value);
        } else {
          processedRow[lowerKey] = value;
        }
      }
      for (const field of jsonFields) {
        if (processedRow[field] !== undefined) {
          processedRow[field] = parseJsonValue(processedRow[field], field === 'inventario_vehiculo' ? {} : []);
        }
      }
      processed.push(processedRow);
    }
    return processed;
  }

  async processRow(row, jsonFields = []) {
    const rows = await this.processRows(row ? [row] : [], jsonFields);
    return rows[0];
  }
}

class Cliente extends BaseModel {
  constructor() {
    super('clientes');
  }

  async findAll() {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} ORDER BY fecha_registro DESC`
    );
    return await this.processRows(result.rows || []);
  }

  async findByDocumento(documento) {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE documento = :documento`,
      { documento }
    );
    return await this.processRow(result.rows?.[0]);
  }

  async countVehiculos(documento) {
    const result = await this.executeQuery(
      `SELECT COUNT(*) AS total FROM vehiculos WHERE cliente_documento = :documento`,
      { documento }
    );
    const row = result.rows?.[0];
    return row?.TOTAL ?? row?.total ?? 0;
  }

  async ultimaOrden(documento) {
    const result = await this.executeQuery(
      `SELECT o.estado, o.fecha_ingreso
       FROM ordenes o
       JOIN vehiculos v ON v.placa = o.placa_vehiculo
       WHERE v.cliente_documento = :documento
       ORDER BY o.fecha_ingreso DESC
       FETCH FIRST 1 ROW ONLY`,
      { documento }
    );
    return await this.processRow(result.rows?.[0]);
  }

  async create(data) {
    await this.executeQuery(
      `INSERT INTO ${this.tableName}
        (documento, nombre, telefono, correo, direccion, comuna, ciudad, fecha_registro)
       VALUES
        (:documento, :nombre, :telefono, :correo, :direccion, :comuna, :ciudad, SYSTIMESTAMP)`,
      {
        documento: data.documento,
        nombre: data.nombre,
        telefono: data.telefono || null,
        correo: data.correo || null,
        direccion: data.direccion || null,
        comuna: data.comuna || null,
        ciudad: data.ciudad || null,
      }
    );
    return await this.findByDocumento(data.documento);
  }

  async update(documento, data) {
    const fields = Object.keys(data);
    if (fields.length === 0) return await this.findByDocumento(documento);
    const setClause = fields.map((key) => `${key} = :${key}`).join(', ');
    await this.executeQuery(
      `UPDATE ${this.tableName} SET ${setClause} WHERE documento = :documento`,
      { ...data, documento }
    );
    return await this.findByDocumento(documento);
  }

  async delete(documento) {
    await this.executeQuery(
      `DELETE FROM ${this.tableName} WHERE documento = :documento`,
      { documento }
    );
  }
}

class Vehiculo extends BaseModel {
  constructor() {
    super('vehiculos');
  }

  async findAll() {
    const result = await this.executeQuery(`SELECT * FROM ${this.tableName}`);
    return await this.processRows(result.rows || []);
  }

  async findByPlaca(placa) {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE placa = :placa`,
      { placa }
    );
    return await this.processRow(result.rows?.[0]);
  }

  async create(data) {
    await this.executeQuery(
      `INSERT INTO ${this.tableName}
        (placa, marca, modelo, color, cliente_documento, ano, tipo, vin, km)
       VALUES
        (:placa, :marca, :modelo, :color, :cliente_documento, :ano, :tipo, :vin, :km)`,
      {
        placa: data.placa,
        marca: data.marca,
        modelo: data.modelo || null,
        color: data.color || null,
        cliente_documento: data.cliente_documento,
        ano: data.ano ?? null,
        tipo: data.tipo || null,
        vin: data.vin || null,
        km: data.km ?? null,
      }
    );
    return await this.findByPlaca(data.placa);
  }

  async update(placa, data) {
    const fields = Object.keys(data);
    if (fields.length === 0) return await this.findByPlaca(placa);
    const setClause = fields.map((key) => `${key} = :${key}`).join(', ');
    await this.executeQuery(
      `UPDATE ${this.tableName} SET ${setClause} WHERE placa = :placa`,
      { ...data, placa }
    );
    return await this.findByPlaca(placa);
  }

  async delete(placa) {
    await this.executeQuery(
      `DELETE FROM ${this.tableName} WHERE placa = :placa`,
      { placa }
    );
  }
}

class Inventario extends BaseModel {
  constructor() {
    super('inventario');
  }

  async findAll() {
    const result = await this.executeQuery(`SELECT * FROM ${this.tableName} ORDER BY id`);
    return await this.processRows(result.rows || []);
  }

  async findById(id) {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
    return await this.processRow(result.rows?.[0]);
  }

  async findAlertas() {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE stock_actual < stock_minimo ORDER BY id`
    );
    return await this.processRows(result.rows || []);
  }

  async create(data) {
    const result = await this.executeQuery(
      `INSERT INTO ${this.tableName}
        (id, nombre_repuesto, sku, categoria, ubicacion, stock_actual, stock_minimo,
         stock_maximo, precio_compra, precio_venta, proveedor)
       VALUES
        (inventario_seq.NEXTVAL, :nombre_repuesto, :sku, :categoria, :ubicacion,
         :stock_actual, :stock_minimo, :stock_maximo, :precio_compra, :precio_venta, :proveedor)
       RETURNING id INTO :out_id`,
      {
        nombre_repuesto: data.nombre_repuesto,
        sku: data.sku || null,
        categoria: data.categoria || null,
        ubicacion: data.ubicacion || null,
        stock_actual: data.stock_actual ?? 0,
        stock_minimo: data.stock_minimo ?? 5,
        stock_maximo: data.stock_maximo ?? null,
        precio_compra: data.precio_compra ?? null,
        precio_venta: data.precio_venta,
        proveedor: data.proveedor || null,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const id = result.outBinds?.out_id?.[0];
    return await this.findById(id);
  }

  async update(id, data) {
    const fields = Object.keys(data);
    if (fields.length === 0) return await this.findById(id);
    const setClause = fields.map((key) => `${key} = :${key}`).join(', ');
    await this.executeQuery(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = :id`,
      { ...data, id }
    );
    return await this.findById(id);
  }

  async delete(id) {
    await this.executeQuery(
      `DELETE FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
  }
}

class MovimientoInventario extends BaseModel {
  constructor() {
    super('movimientos_inventario');
  }

  async findAll() {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} ORDER BY fecha DESC`
    );
    return await this.processRows(result.rows || []);
  }

  async create(data) {
    const result = await this.executeQuery(
      `INSERT INTO ${this.tableName} (id, repuesto_id, tipo_movimiento, cantidad, fecha)
       VALUES (movimientos_seq.NEXTVAL, :repuesto_id, :tipo_movimiento, :cantidad, SYSTIMESTAMP)
       RETURNING id INTO :out_id`,
      {
        repuesto_id: data.repuesto_id,
        tipo_movimiento: data.tipo_movimiento,
        cantidad: data.cantidad,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const id = result.outBinds?.out_id?.[0];
    const row = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
    return await this.processRow(row.rows?.[0]);
  }
}

class Orden extends BaseModel {
  constructor() {
    super('ordenes');
  }

  _prepareBinds(data) {
    const binds = { ...data };
    for (const field of ORDEN_JSON_FIELDS) {
      if (binds[field] !== undefined && binds[field] !== null) {
        binds[field] = stringifyJsonValue(binds[field]);
      }
    }
    return binds;
  }

  async findAll() {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} ORDER BY fecha_ingreso DESC`
    );
    return await this.processRows(result.rows || [], ORDEN_JSON_FIELDS);
  }

  async findById(id) {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
    return await this.processRow(result.rows?.[0], ORDEN_JSON_FIELDS);
  }

  async create(data) {
    const binds = this._prepareBinds({
      placa_vehiculo: data.placa_vehiculo,
      diagnostico: data.diagnostico || null,
      trabajo_realizado: data.trabajo_realizado || null,
      estado: data.estado || 'Diagnostico',
      numero: data.numero || null,
      tipo_servicio: data.tipo_servicio || null,
      descripcion: data.descripcion || null,
      prioridad: data.prioridad || null,
      lineas: data.lineas || [],
      inventario_vehiculo: data.inventario_vehiculo || {},
      kilometraje: data.kilometraje ?? null,
      nivel_combustible: data.nivel_combustible ?? null,
      estado_vehiculo: data.estado_vehiculo || null,
      notas: data.notas || [],
      tareas: data.tareas || [],
      subtotal: data.subtotal ?? null,
      descuento: data.descuento ?? null,
      iva: data.iva ?? null,
      total: data.total ?? null,
      tecnico_asignado: data.tecnico_asignado || null,
      fecha_ingreso: data.fecha_ingreso || new Date(),
      fecha_entrega: data.fecha_entrega || null,
    });
    binds.out_id = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };

    const result = await this.executeQuery(
      `INSERT INTO ${this.tableName}
        (id, placa_vehiculo, diagnostico, trabajo_realizado, estado, numero, tipo_servicio,
         descripcion, prioridad, lineas, inventario_vehiculo, kilometraje, nivel_combustible,
         estado_vehiculo, notas, tareas, subtotal, descuento, iva, total, tecnico_asignado,
         fecha_ingreso, fecha_entrega)
       VALUES
        (ordenes_seq.NEXTVAL, :placa_vehiculo, :diagnostico, :trabajo_realizado, :estado,
         :numero, :tipo_servicio, :descripcion, :prioridad, :lineas, :inventario_vehiculo,
         :kilometraje, :nivel_combustible, :estado_vehiculo, :notas, :tareas,
         :subtotal, :descuento, :iva, :total, :tecnico_asignado,
         :fecha_ingreso, :fecha_entrega)
       RETURNING id INTO :out_id`,
      binds
    );
    const id = result.outBinds?.out_id?.[0];
    return await this.findById(id);
  }

  async update(id, data) {
    const binds = this._prepareBinds({ ...data, id });
    const fields = Object.keys(data);
    if (fields.length === 0) return await this.findById(id);
    const setClause = fields.map((key) => `${key} = :${key}`).join(', ');
    await this.executeQuery(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = :id`,
      binds
    );
    return await this.findById(id);
  }

  async delete(id) {
    await this.executeQuery(
      `DELETE FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
  }

  async resumenEstados() {
    const result = await this.executeQuery(
      `SELECT estado, COUNT(*) AS total FROM ${this.tableName} GROUP BY estado ORDER BY estado`
    );
    return await this.processRows(result.rows || []);
  }
}

class OrdenRepuesto extends BaseModel {
  constructor() {
    super('orden_repuestos');
  }

  async create(data) {
    const result = await this.executeQuery(
      `INSERT INTO ${this.tableName} (id, orden_id, repuesto_id, cantidad)
       VALUES (orden_repuestos_seq.NEXTVAL, :orden_id, :repuesto_id, :cantidad)
       RETURNING id INTO :out_id`,
      {
        orden_id: data.orden_id,
        repuesto_id: data.repuesto_id,
        cantidad: data.cantidad ?? 1,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const id = result.outBinds?.out_id?.[0];
    const row = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
    return await this.processRow(row.rows?.[0]);
  }
}

class Pago extends BaseModel {
  constructor() {
    super('pagos');
  }

  async findAll() {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} ORDER BY fecha_pago DESC`
    );
    return await this.processRows(result.rows || []);
  }

  async findById(id) {
    const result = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
    return await this.processRow(result.rows?.[0]);
  }

  async create(data) {
    const result = await this.executeQuery(
      `INSERT INTO ${this.tableName} (id, orden_id, monto_total, metodo_pago, referencia, fecha_pago)
       VALUES (pagos_seq.NEXTVAL, :orden_id, :monto_total, :metodo_pago, :referencia, SYSTIMESTAMP)
       RETURNING id INTO :out_id`,
      {
        orden_id: data.orden_id,
        monto_total: data.monto_total,
        metodo_pago: data.metodo_pago || null,
        referencia: data.referencia || null,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const id = result.outBinds?.out_id?.[0];
    return await this.findById(id);
  }

  async delete(id) {
    await this.executeQuery(
      `DELETE FROM ${this.tableName} WHERE id = :id`,
      { id }
    );
  }
}

module.exports = {
  Cliente,
  Vehiculo,
  Inventario,
  MovimientoInventario,
  Orden,
  OrdenRepuesto,
  Pago,
};
