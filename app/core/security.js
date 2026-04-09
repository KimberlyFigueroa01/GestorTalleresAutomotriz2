const axios = require('axios');
const jwt = require('jsonwebtoken');
const { getSettings } = require('./config');

const settings = getSettings();

class KeycloakOIDC {
  constructor() {
    this.issuer = null;
    this.tokenEndpoint = null;
  }

  async discover() {
    const url = `${settings.KEYCLOAK_SERVER_URL.replace(/\/$/, '')}/realms/${settings.KEYCLOAK_REALM}/.well-known/openid-configuration`;
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    this.issuer = data.issuer;
    this.tokenEndpoint = data.token_endpoint;
  }

  async verifyToken(token) {
    try {
      // Decodificar el token JWT localmente (sin verificar firma por ahora)
      const payload = jwt.decode(token);
      if (!payload) {
        throw new Error('Token inválido');
      }

      // Verificar audience si está configurada
      const expectedAud = settings.KEYCLOAK_AUDIENCE;
      if (expectedAud) {
        const tokenAud = payload.aud;
        const audSet = Array.isArray(tokenAud) ? new Set(tokenAud) : new Set([tokenAud]);
        if (!audSet.has(expectedAud)) {
          throw new Error('Token audience inválida');
        }
      }

      return payload;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  async login(username, password) {
    if (!this.tokenEndpoint) {
      throw new Error('Servicio de autenticación no disponible');
    }

    try {
      const response = await axios.post(this.tokenEndpoint, new URLSearchParams({
        grant_type: 'password',
        client_id: settings.KEYCLOAK_CLIENT_ID,
        client_secret: settings.KEYCLOAK_CLIENT_SECRET,
        username,
        password,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const tokenData = response.data;
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      };
    } catch (error) {
      throw new Error('Credenciales inválidas o Keycloak no disponible');
    }
  }
}

const keycloakOidc = new KeycloakOIDC();

function extractRoles(payload) {
  const realmRoles = new Set(payload.realm_access?.roles || []);
  const clientRoles = new Set(payload.resource_access?.[settings.KEYCLOAK_CLIENT_ID]?.roles || []);
  return new Set([...realmRoles, ...clientRoles]);
}

const keycloakAuthMiddleware = (req, res, next) => {
  const excludePaths = ['/health', '/api/auth/login', '/api/auth/keycloak/status'];
  if (excludePaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  keycloakOidc.verifyToken(token)
    .then(payload => {
      req.user = payload;
      req.roles = extractRoles(payload);
      next();
    })
    .catch(error => {
      res.status(401).json({ detail: error.message });
    });
};

function requireRoles(...requiredRoles) {
  return (req, res, next) => {
    const userRoles = req.roles || new Set();
    const hasRole = requiredRoles.some(role => userRoles.has(role));
    if (requiredRoles.length > 0 && !hasRole) {
      return res.status(403).json({ detail: 'No autorizado para este recurso' });
    }
    next();
  };
}

module.exports = { keycloakOidc, keycloakAuthMiddleware, requireRoles };