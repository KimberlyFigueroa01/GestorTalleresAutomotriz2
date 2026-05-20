const { Cliente } = require('../entities/models');

class ClientesRepository {
  constructor() {
    this.model = new Cliente();
  }

  async list() {
    return await this.model.findAll();
  }

  async get(documento) {
    return await this.model.findByDocumento(documento);
  }

  async create(payload) {
    return await this.model.create(payload);
  }

  _resolveDocumento(instance) {
    return instance?.documento || instance?.DOCUMENTO;
  }

  async update(instance, payload) {
    const documento = this._resolveDocumento(instance);
    return await this.model.update(documento, payload);
  }

  async delete(instance) {
    const documento = this._resolveDocumento(instance);
    await this.model.delete(documento);
  }
}

module.exports = ClientesRepository;
