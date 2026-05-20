const { getOrSet, invalidate } = require('../core/cache');

const TTL = parseInt(process.env.CACHE_TTL_CLIENTES, 10) || 120;

class OrdenesService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return getOrSet('ordenes:all', () => this.repository.list(), TTL);
  }

  async get(id) {
    return getOrSet(`ordenes:${id}`, async () => {
      const orden = await this.repository.get(id);
      if (!orden) {
        const error = new Error('Orden no encontrada');
        error.statusCode = 404;
        throw error;
      }
      return orden;
    }, TTL);
  }

  async listResumen() {
    return getOrSet('ordenes:resumen', () => this.repository.resumenEstados(), TTL);
  }

  async create(payload) {
    const orden = await this.repository.create(payload);
    await invalidate('ordenes:all', 'ordenes:resumen');
    return orden;
  }

  async update(id, payload) {
    const orden = await this.repository.get(id);
    if (!orden) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }
    const updated = await this.repository.update(id, payload);
    await invalidate('ordenes:all', `ordenes:${id}`, 'ordenes:resumen');
    return updated;
  }

  async delete(id) {
    const orden = await this.repository.get(id);
    if (!orden) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.delete(id);
    await invalidate('ordenes:all', `ordenes:${id}`, 'ordenes:resumen');
  }

  async addRepuesto(payload) {
    const orden = await this.repository.get(payload.orden_id);
    if (!orden) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }
    const result = await this.repository.addRepuesto(payload);
    await invalidate('ordenes:all', `ordenes:${payload.orden_id}`, 'ordenes:resumen');
    return result;
  }
}

module.exports = OrdenesService;
