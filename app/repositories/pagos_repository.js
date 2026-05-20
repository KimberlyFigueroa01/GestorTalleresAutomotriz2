const { Pago } = require('../entities/models');

class PagosRepository {
  constructor() {
    this.model = new Pago();
  }

  async list() {
    return await this.model.findAll();
  }

  async get(pagoId) {
    return await this.model.findById(pagoId);
  }

  async create(payload) {
    return await this.model.create(payload);
  }

  async delete(pagoId) {
    await this.model.delete(pagoId);
  }
}

module.exports = PagosRepository;
