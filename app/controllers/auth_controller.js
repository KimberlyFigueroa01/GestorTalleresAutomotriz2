const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth_service');
const { keycloakOidc } = require('../core/security');
const { loginRequestSchema } = require('../schemas/auth');

const authService = new AuthService();

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const token = await authService.login(value.username, value.password);
    res.json(token);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/keycloak/status', (req, res) => {
  res.json({
    issuer: keycloakOidc.issuer,
    token_endpoint: keycloakOidc.tokenEndpoint,
    status: keycloakOidc.issuer ? 'ok' : 'not_initialized',
  });
});

module.exports = router;