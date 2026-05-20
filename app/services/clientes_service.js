const ClientesRepository = require('../repositories/clientes_repository');

class ClientesService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return await this.repository.list();
  }

  async get(documento) {
    const cliente = await this.repository.get(documento);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    return cliente;
  }

  async create(payload) {
    return await this.repository.create(payload);
  }

  async update(documento, payload) {
    const cliente = await this.get(documento);
    return await this.repository.update(cliente, payload);
  }

  async delete(documento) {
    const cliente = await this.get(documento);
    await this.repository.delete(cliente);
  }
}

module.exports = ClientesService;
