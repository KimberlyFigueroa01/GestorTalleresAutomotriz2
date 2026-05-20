const express = require('express');
const router = express.Router();
const { requireRoles } = require('../core/security');
const { getEstadisticas } = require('../kafka/consumer');
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
    const pagoModel = new Pago();
    const pagos = await pagoModel.findAll();
    const normalized = pagos.map(normalizeRow);

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

    const result = Object.values(ingresosPorDia)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(d => ({ ...d, total_dia: Math.round(d.total_dia * 100) / 100 }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alertas-stock', requireRoles('admin', 'gerencia'), async (_req, res) => {
  try {
    const inventarioModel = new Inventario();
    const items = await inventarioModel.findAll();
    const normalized = items.map(normalizeRow);

    const alertas = normalized
      .filter(item => (item.stock_actual || 0) < (item.stock_minimo || 5))
      .map(item => ({
        id: item.id,
        nombre_repuesto: item.nombre_repuesto,
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
      }));

    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ordenes', requireRoles('admin', 'gerencia'), async (_req, res) => {
  try {
    const ordenModel = new Orden();
    const ordenes = await ordenModel.findAll();
    const normalized = ordenes.map(normalizeRow);

    const resumen = normalized.map(o => ({
      id: o.id,
      placa_vehiculo: o.placa_vehiculo,
      estado: o.estado,
      fecha_ingreso: o.fecha_ingreso,
      fecha_entrega: o.fecha_entrega,
    }));

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/kafka-metricas', requireRoles('admin', 'gerencia'), (_req, res) => {
  const stats = getEstadisticas();
  res.json(stats);
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