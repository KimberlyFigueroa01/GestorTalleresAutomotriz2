const { sendEvent } = require('../producer');

/**
 * PagosService
 * Handles business logic for pagos with Kafka event publishing
 * and specific error handling for unique constraint violations.
 */
class PagosService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return await this.repository.list();
  }

  async create(payload) {
    try {
      const pago = await this.repository.create(payload);

      // Publish domain event to Kafka (fire-and-forget)
      sendEvent('seguridad.accesos', {
        tipo: 'pago_creado',
        pagoId: pago.ID || pago.id,
        ordenId: pago.ORDEN_ID || pago.orden_id,
        montoTotal: String(pago.MONTO_TOTAL || pago.monto_total),
        metodoPago: pago.METODO_PAGO || pago.metodo_pago,
      }).catch(() => {});

      return pago;
    } catch (err) {
      this._handleUniqueConstraintError(err);
      throw err;
    }
  }

  /**
   * Detects Oracle unique constraint violations (ORA-00001) and
   * PostgreSQL duplicate key errors, then throws a controlled 409.
   */
  _handleUniqueConstraintError(err) {
    const message = (err.message || '').toLowerCase();
    const isUniqueViolation =
      message.includes('ora-00001') ||
      message.includes('unique constraint') ||
      message.includes('duplicate') ||
      message.includes('llave duplicada') ||
      message.includes('already exists');

    if (isUniqueViolation) {
      const controlledError = new Error('Ya existe un pago con esos datos');
      controlledError.statusCode = 409;
      throw controlledError;
    }
  }
}

module.exports = PagosService;
