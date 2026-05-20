class InventarioService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return await this.repository.list();
  }

  async get(id) {
    const item = await this.repository.get(id);
    if (!item) throw new Error('Repuesto no encontrado');
    return item;
  }

  async listAlertas() {
    return await this.repository.listAlertas();
  }

  async create(payload) {
    return await this.repository.create(payload);
  }

  async update(id, payload) {
    await this.get(id);
    return await this.repository.update(id, payload);
  }

  async delete(id) {
    await this.get(id);
    await this.repository.delete(id);
  }

  async listMovimientos() {
    return await this.repository.listMovimientos();
  }

  async createMovimiento(payload) {
    await this.get(payload.repuesto_id);
    const movimiento = await this.repository.createMovimiento(payload);
    const delta = payload.tipo_movimiento === 'ENTRADA' ? payload.cantidad : -payload.cantidad;
    const item = await this.get(payload.repuesto_id);
    const stockActual = Number(item.stock_actual || 0) + delta;
    await this.repository.update(payload.repuesto_id, { stock_actual: stockActual });
    return movimiento;
  }
}

module.exports = InventarioService;
