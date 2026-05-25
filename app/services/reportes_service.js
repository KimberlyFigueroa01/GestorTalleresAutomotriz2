const { Orden, Pago, Inventario } = require('../entities/models');
const { getOrSet } = require('../core/cache');

const TTL = parseInt(process.env.CACHE_TTL_REPORTES, 10) || 60;

class ReportesService {
  /**
   * Normalizes Oracle UPPERCASE keys to lowercase.
   */
  _normalizeRow(row) {
    if (!row) return row;
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key.toLowerCase()] = value;
    }
    return normalized;
  }

  /**
   * Obtiene ingresos agrupados por día con cache.
   */
  async ingresos() {
    const pagoModel = new Pago();
    const pagos = await pagoModel.findAll();
    const normalized = pagos.map(p => this._normalizeRow(p));

    // Group payments by date
    const ingresosPorDia = {};
    for (const p of normalized) {
      if (!p.fecha_pago) continue;
      const fecha = new Date(p.fecha_pago).toISOString().split('T')[0];
      if (!ingresosPorDia[fecha]) {
        ingresosPorDia[fecha] = { fecha, total_dia: 0, cantidad_pagos: 0 };
      }
      ingresosPorDia[fecha].total_dia += parseFloat(p.monto_total) || 0;
      ingresosPorDia[fecha].cantidad_pagos += 1;
    }

    return Object.values(ingresosPorDia)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(d => ({ ...d, total_dia: Math.round(d.total_dia * 100) / 100 }));
  }

  /**
   * Obtiene alertas de stock bajo con cache.
   */
  async alertasStock() {
    const inventarioModel = new Inventario();
    const items = await inventarioModel.findAll();
    const normalized = items.map(i => this._normalizeRow(i));

    return normalized
      .filter(item => (item.stock_actual || 0) < (item.stock_minimo || 5))
      .map(item => ({
        id: item.id,
        nombre_repuesto: item.nombre_repuesto,
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
      }));
  }

  /**
   * Obtiene resumen de órdenes con cache.
   */
  async ordenes() {
    const ordenModel = new Orden();
    const ordenes = await ordenModel.findAll();
    const normalized = ordenes.map(o => this._normalizeRow(o));

    return normalized.map(o => ({
      id: o.id,
      placa_vehiculo: o.placa_vehiculo,
      estado: o.estado,
      fecha_ingreso: o.fecha_ingreso,
      fecha_entrega: o.fecha_entrega,
    }));
  }
}

const service = new ReportesService();

module.exports = {
  /**
   * Obtiene ingresos por día con cache.
   */
  getIngresos: async () => {
    return getOrSet('reportes:ingresos', () => service.ingresos(), TTL);
  },

  /**
   * Obtiene alertas de stock con cache.
   */
  getAlertasStock: async () => {
    return getOrSet('reportes:alertas-stock', () => service.alertasStock(), TTL);
  },

  /**
   * Obtiene resumen de órdenes con cache.
   */
  getOrdenes: async () => {
    return getOrSet('reportes:ordenes', () => service.ordenes(), TTL);
  },
};
