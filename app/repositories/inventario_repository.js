const { Inventario, MovimientoInventario } = require('../entities/models');

class InventarioRepository {
  constructor() {
    this.model = new Inventario();
    this.movimientoModel = new MovimientoInventario();
  }

  async list() {
    return await this.model.findAll();
  }

  async get(id) {
    return await this.model.findById(id);
  }

  async listAlertas() {
    return await this.model.findAlertas();
  }

  async create(payload) {
    return await this.model.create(payload);
  }

  async update(id, payload) {
    return await this.model.update(id, payload);
  }

  async delete(id) {
    await this.model.delete(id);
  }

  async listMovimientos() {
    return await this.movimientoModel.findAll();
  }

  async createMovimiento(payload) {
    return await this.movimientoModel.create(payload);
  }
}

module.exports = InventarioRepository;
