const { Vehiculo } = require('../entities/models');

class VehiculosRepository {
  constructor() {
    this.model = new Vehiculo();
  }

  async list() {
    return await this.model.findAll();
  }

  async get(placa) {
    return await this.model.findByPlaca(placa);
  }

  async create(payload) {
    return await this.model.create(payload);
  }

  async update(placa, payload) {
    return await this.model.update(placa, payload);
  }

  async delete(placa) {
    await this.model.delete(placa);
  }
}

module.exports = VehiculosRepository;
