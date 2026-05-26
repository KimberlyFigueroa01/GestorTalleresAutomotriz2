const express = require('express');
const router = express.Router();
const { requireRoles } = require('../core/security');
const { getEstadisticas } = require('../kafka/consumer');
const reportesService = require('../services/reportes_service');
const { Orden, Pago, Inventario, Vehiculo, Cliente } = require('../entities/models');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Normalizes Oracle UPPERCASE keys to lowercase.
 */
function normalizeRow(row) {
  if (!row) return row;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

/**
 * Formats a month label from a Date object (e.g. "Jan", "Feb").
 */
function getMonthLabel(date) {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months[date.getMonth()] || 'N/A';
}

// ── Report endpoints ────────────────────────────────────────────────

router.get('/ingresos', requireRoles('admin', 'gerencia'), async (_req, res) => {
  try {
    const result = await reportesService.getIngresos();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alertas-stock', requireRoles('admin', 'gerencia'), async (_req, res) => {
  try {
    const alertas = await reportesService.getAlertasStock();
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ordenes', requireRoles('admin', 'gerencia'), async (_req, res) => {
  try {
    const resumen = await reportesService.getOrdenes();
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Dashboard (structured, scalable response) ──────────────────────

router.get('/dashboard', requireRoles('admin', 'gerencia'), async (_req, res) => {
  try {
    // Fetch all required data in parallel
    const ordenModel = new Orden();
    const pagoModel = new Pago();
    const inventarioModel = new Inventario();
    const vehiculoModel = new Vehiculo();
    const clienteModel = new Cliente();

    const [ordenesRaw, pagosRaw, inventarioRaw] = await Promise.all([
      ordenModel.findAll(),
      pagoModel.findAll(),
      inventarioModel.findAll(),
    ]);

    const ordenes = ordenesRaw.map(normalizeRow);
    const pagos = pagosRaw.map(normalizeRow);
    const inventario = inventarioRaw.map(normalizeRow);

    // ── KPIs ──────────────────────────────────────────────────────
    const estadosActivos = new Set(['ABIERTA', 'EN_PROGRESO', 'DIAGNOSTICO']);
    const ordenesActivas = ordenes.filter(
      o => estadosActivos.has((o.estado || '').toUpperCase())
    ).length;

    const vehiculosEnTaller = ordenes.filter(
      o => (o.estado || '').toUpperCase() !== 'CERRADA'
    ).length;

    const stockBajo = inventario.filter(
      item => (item.stock_actual || 0) < (item.stock_minimo || 5)
    ).length;

    const now = new Date();
    const ingresosMes = pagos
      .filter(p => {
        if (!p.fecha_pago) return false;
        const fecha = new Date(p.fecha_pago);
        return fecha.getFullYear() === now.getFullYear() &&
               fecha.getMonth() === now.getMonth();
      })
      .reduce((sum, p) => sum + (parseFloat(p.monto_total) || 0), 0);

    // ── Chart: ingresos por mes ───────────────────────────────────
    const ingresosPorMesMap = {};
    for (const p of pagos) {
      if (!p.fecha_pago) continue;
      const fecha = new Date(p.fecha_pago);
      const label = getMonthLabel(fecha);
      ingresosPorMesMap[label] = (ingresosPorMesMap[label] || 0) +
        (parseFloat(p.monto_total) || 0);
    }
    const ingresosPorMes = Object.entries(ingresosPorMesMap).map(
      ([label, value]) => ({ label, value: Math.round(value * 100) / 100, color: null })
    );

    // ── Chart: ordenes por estado ─────────────────────────────────
    const estadosMap = {};
    for (const o of ordenes) {
      const estado = (o.estado || '').toUpperCase();
      estadosMap[estado] = (estadosMap[estado] || 0) + 1;
    }
    const ordenesPorEstado = Object.entries(estadosMap).map(
      ([label, value]) => ({
        label: label.charAt(0) + label.slice(1).toLowerCase(),
        value,
        color: null,
      })
    );

    // ── Ordenes recientes ─────────────────────────────────────────
    const recientes = [];
    const ordenesRecientes = ordenes
      .sort((a, b) => {
        const fa = a.fecha_ingreso ? new Date(a.fecha_ingreso).getTime() : 0;
        const fb = b.fecha_ingreso ? new Date(b.fecha_ingreso).getTime() : 0;
        return fb - fa;
      })
      .slice(0, 3);

    for (const orden of ordenesRecientes) {
      let clienteNombre = '';
      if (orden.placa_vehiculo) {
        try {
          const vehiculo = await vehiculoModel.findByPlaca(orden.placa_vehiculo);
          if (vehiculo) {
            const v = normalizeRow(vehiculo);
            if (v.cliente_documento) {
              const cliente = await clienteModel.findByDocumento(v.cliente_documento);
              if (cliente) {
                const c = normalizeRow(cliente);
                clienteNombre = c.nombre || '';
              }
            }
          }
        } catch (_) {
          // Best-effort lookup
        }
      }
      recientes.push({
        numero: orden.numero || String(orden.id || 0).padStart(4, '0'),
        cliente: clienteNombre,
        estado: orden.estado || '',
      });
    }

    // ── Structured response ───────────────────────────────────────
    res.json({
      ordenesActivas,
      ingresosMes: Math.round(ingresosMes * 100) / 100,
      vehiculosEnTaller,
      stockBajo,
      ingresosPorMes,
      ordenesPorEstado,
      ordenesRecientes: recientes,
    });
  } catch (error) {
    console.error('Error en dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;