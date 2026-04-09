const { Cliente } = require('../entities/models');
const { v4: uuidv4 } = require('uuid');

class ClientesRepository {
  constructor() {
    this.model = new Cliente();
  }

  async list() {
    return await this.model.findAll();
  }

  async get(clienteId) {
    return await this.model.findById(clienteId);
  }

  async create(payload) {
    payload.id = uuidv4();
    return await this.model.create(payload);
  }

  async update(instance, payload) {
    return await this.model.update(instance.ID, payload); // Asumiendo que ID es el campo
  }

  async delete(instance) {
    await this.model.delete(instance.ID);
  }
}

module.exports = ClientesRepository;