const { getOrSet, invalidate } = require('../core/cache');

const TTL = parseInt(process.env.CACHE_TTL_CLIENTES, 10) || 120;

class InventarioService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return getOrSet('inventario:all', () => this.repository.list(), TTL);
  }

  async get(id) {
    return getOrSet(`inventario:${id}`, async () => {
      const item = await this.repository.get(id);
      if (!item) throw new Error('Repuesto no encontrado');
      return item;
    }, TTL);
  }

  async listAlertas() {
    return getOrSet('inventario:alertas', () => this.repository.listAlertas(), TTL);
  }

  async listMovimientos() {
    return getOrSet('inventario:movimientos', () => this.repository.listMovimientos(), TTL);
  }

  async create(payload) {
    const item = await this.repository.create(payload);
    await invalidate('inventario:all', 'inventario:alertas');
    return item;
  }

  async update(id, payload) {
    const item = await this.repository.get(id);
    if (!item) throw new Error('Repuesto no encontrado');
    const updated = await this.repository.update(id, payload);
    await invalidate('inventario:all', `inventario:${id}`, 'inventario:alertas');
    return updated;
  }

  async delete(id) {
    const item = await this.repository.get(id);
    if (!item) throw new Error('Repuesto no encontrado');
    await this.repository.delete(id);
    await invalidate('inventario:all', `inventario:${id}`, 'inventario:alertas');
  }

  async createMovimiento(payload) {
    const item = await this.repository.get(payload.repuesto_id);
    if (!item) throw new Error('Repuesto no encontrado');

    const movimiento = await this.repository.createMovimiento(payload);
    const delta = payload.tipo_movimiento === 'ENTRADA' ? payload.cantidad : -payload.cantidad;
    const stockActual = Number(item.stock_actual || 0) + delta;
    await this.repository.update(payload.repuesto_id, { stock_actual: stockActual });

    await invalidate(
      'inventario:all',
      `inventario:${payload.repuesto_id}`,
      'inventario:alertas',
      'inventario:movimientos'
    );
    return movimiento;
  }
}

module.exports = InventarioService;
