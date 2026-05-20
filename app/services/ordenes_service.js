class OrdenesService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return await this.repository.list();
  }

  async get(id) {
    const orden = await this.repository.get(id);
    if (!orden) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }
    return orden;
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

  async listResumen() {
    return await this.repository.resumenEstados();
  }

  async addRepuesto(payload) {
    await this.get(payload.orden_id);
    return await this.repository.addRepuesto(payload);
  }
}

module.exports = OrdenesService;
