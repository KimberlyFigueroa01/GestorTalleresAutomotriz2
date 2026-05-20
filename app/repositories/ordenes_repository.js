const { Orden, OrdenRepuesto } = require('../entities/models');

class OrdenesRepository {
  constructor() {
    this.model = new Orden();
    this.repuestoModel = new OrdenRepuesto();
  }

  async list() {
    return await this.model.findAll();
  }

  async get(id) {
    return await this.model.findById(id);
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

  async resumenEstados() {
    return await this.model.resumenEstados();
  }

  async addRepuesto(payload) {
    return await this.repuestoModel.create(payload);
  }
}

module.exports = OrdenesRepository;
