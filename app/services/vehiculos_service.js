const { getOrSet, invalidate } = require('../core/cache');

const TTL = parseInt(process.env.CACHE_TTL_VEHICULOS, 10) || 120;

/**
 * VehiculosService
 * Handles business logic for vehiculos with specific error handling
 * for Oracle unique constraint violations (ORA-00001).
 */
class VehiculosService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return getOrSet('vehiculos:all', () => this.repository.list(), TTL);
  }

  async get(placa) {
    return getOrSet(`vehiculos:${placa}`, async () => {
      const vehiculo = await this.repository.get(placa);
      if (!vehiculo) {
        const error = new Error('Vehiculo no encontrado');
        error.statusCode = 404;
        throw error;
      }
      return vehiculo;
    }, TTL);
  }

  async create(payload) {
    try {
      const vehiculo = await this.repository.create(payload);
      await invalidate('vehiculos:all');
      return vehiculo;
    } catch (err) {
      this._handleUniqueConstraintError(err, 'placa');
      throw err;
    }
  }

  async update(placa, payload) {
    const existing = await this.repository.get(placa);
    if (!existing) {
      const error = new Error('Vehiculo no encontrado');
      error.statusCode = 404;
      throw error;
    }
    try {
      const vehiculo = await this.repository.update(placa, payload);
      await invalidate('vehiculos:all', `vehiculos:${placa}`);
      return vehiculo;
    } catch (err) {
      this._handleUniqueConstraintError(err, 'placa');
      throw err;
    }
  }

  async delete(placa) {
    const existing = await this.repository.get(placa);
    if (!existing) {
      const error = new Error('Vehiculo no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await this.repository.delete(placa);
    await invalidate('vehiculos:all', `vehiculos:${placa}`);
  }

  _handleUniqueConstraintError(err, field) {
    const message = (err.message || '').toLowerCase();
    const isUniqueViolation =
      message.includes('ora-00001') ||
      message.includes('unique constraint') ||
      message.includes('duplicate') ||
      message.includes('llave duplicada') ||
      message.includes('already exists');

    if (isUniqueViolation) {
      const controlledError = new Error(
        `Ya existe un vehiculo con esa ${field}`
      );
      controlledError.statusCode = 409;
      throw controlledError;
    }
  }
}

module.exports = VehiculosService;
