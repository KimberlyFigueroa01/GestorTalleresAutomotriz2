const ClientesRepository = require('../repositories/clientes_repository');

class ClientesService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return await this.repository.list();
  }

  async get(clienteId) {
    const cliente = await this.repository.get(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    return cliente;
  }

  async create(payload) {
    return await this.repository.create(payload);
  }

  async update(clienteId, payload) {
    const cliente = await this.get(clienteId);
    return await this.repository.update(cliente, payload);
  }

  async delete(clienteId) {
    const cliente = await this.get(clienteId);
    await this.repository.delete(cliente);
  }
}

module.exports = ClientesService;