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
    return await this.repository.list();
  }

  async get(placa) {
    const vehiculo = await this.repository.get(placa);
    if (!vehiculo) {
      const error = new Error('Vehiculo no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return vehiculo;
  }

  async create(payload) {
    try {
      return await this.repository.create(payload);
    } catch (err) {
      this._handleUniqueConstraintError(err, 'placa');
      throw err;
    }
  }

  async update(placa, payload) {
    await this.get(placa);
    try {
      return await this.repository.update(placa, payload);
    } catch (err) {
      this._handleUniqueConstraintError(err, 'placa');
      throw err;
    }
  }

  async delete(placa) {
    await this.get(placa);
    await this.repository.delete(placa);
  }

  /**
   * Detects Oracle unique constraint violations (ORA-00001) and
   * PostgreSQL duplicate key errors, then throws a controlled 409
   * instead of a generic 500.
   */
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
