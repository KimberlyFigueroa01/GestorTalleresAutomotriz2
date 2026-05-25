const ClientesRepository = require('../repositories/clientes_repository');
const { getOrSet, invalidate } = require('../core/cache');

const TTL = parseInt(process.env.CACHE_TTL_CLIENTES, 10) || 120;

class ClientesService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return getOrSet('clientes:all', () => this.repository.list(), TTL);
  }

  async get(documento) {
    return getOrSet(`clientes:${documento}`, async () => {
      const cliente = await this.repository.get(documento);
      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }
      return cliente;
    }, TTL);
  }

  async create(payload) {
    const cliente = await this.repository.create(payload);
    await invalidate('clientes:all');
    return cliente;
  }

  async update(documento, payload) {
    const cliente = await this.repository.get(documento);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    const updated = await this.repository.update(cliente, payload);
    await invalidate('clientes:all', `clientes:${documento}`);
    if (payload.documento && payload.documento !== documento) {
      await invalidate(`clientes:${payload.documento}`);
    }
    return updated;
  }

  async delete(documento) {
    const cliente = await this.repository.get(documento);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    await this.repository.delete(cliente);
    await invalidate('clientes:all', `clientes:${documento}`);
  }
}

module.exports = ClientesService;
