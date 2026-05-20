const express = require('express');
const router = express.Router();
const PagosRepository = require('../repositories/pagos_repository');
const PagosService = require('../services/pagos_service');
const { requireRoles } = require('../core/security');
const { pagoFrontendCreateSchema } = require('../schemas/pagos');
const { sendEvent } = require('../producer');

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
 * Extracts the numeric portion of a prefixed ID string (e.g. "OT-123" → 123).
 */
function parseOrdenId(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Builds a frontend-compatible response from a DB pago row.
 * Mirrors the reference backend's _build_front_pago function.
 */
function buildFrontPago(pagoRaw) {
  const p = normalizeRow(pagoRaw);
  const fechaPago = p.fecha_pago
    ? new Date(p.fecha_pago).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    id: `P-${p.id}`,
    ordenId: `OT-${p.orden_id}`,
    metodo: (p.metodo_pago || 'efectivo').toLowerCase(),
    monto: parseFloat(p.monto_total) || 0,
    referencia: p.referencia || null,
    fecha: fechaPago,
  };
}

// ── Routes ──────────────────────────────────────────────────────────

router.get('/', requireRoles('admin', 'cajero'), async (req, res) => {
  try {
    const repository = new PagosRepository();
    const service = new PagosService(repository);
    const pagos = await service.list();

    const results = pagos.map(pago => buildFrontPago(pago));

    sendEvent('seguridad.accesos', {
      tipo: 'pagos_listado',
      cantidad: results.length,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.json(results);
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'pagos_listado_error',
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'cajero'), async (req, res) => {
  try {
    const { error, value } = pagoFrontendCreateSchema.validate(req.body);
    if (error) {
      sendEvent('seguridad.accesos', {
        tipo: 'pago_creado_error',
        motivo: 'validacion_fallida',
        error: error.details[0].message,
        usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
      }).catch(() => {});
      return res.status(400).json({ error: error.details[0].message });
    }

    const repository = new PagosRepository();
    const service = new PagosService(repository);

    // Map frontend payload to DB-compatible payload
    const ordenId = parseOrdenId(value.ordenId);
    const dbPayload = {
      orden_id: ordenId,
      monto_total: value.monto,
      metodo_pago: value.metodo,
      referencia: value.referencia || null,
    };

    const pago = await service.create(dbPayload);

    sendEvent('seguridad.accesos', {
      tipo: 'pago_registrado',
      ordenId: ordenId,
      monto: value.monto,
      metodo: value.metodo,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(201).json(buildFrontPago(pago));
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'pago_creado_error',
      motivo: error.statusCode === 409 ? 'duplicado' : 'error_bd',
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

module.exports = router;