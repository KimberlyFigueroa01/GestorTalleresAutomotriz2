const axios = require('axios');
const jwt = require('jsonwebtoken');
const { getSettings } = require('./config');
const { sendEvent } = require('../producer');

const settings = getSettings();

class KeycloakOIDC {
  constructor() {
    this.issuer = null;
    this.tokenEndpoint = null;
  }

  async discover() {
    let serverUrl = settings.KEYCLOAK_SERVER_URL.replace(/\/$/, '');
    if (!/^https?:\/\//i.test(serverUrl)) {
      serverUrl = `http://${serverUrl}`;
    }

    const candidates = [...new Set([serverUrl, `${serverUrl}/auth`])];
    let lastError = null;

    for (const baseUrl of candidates) {
      const url = `${baseUrl}/realms/${settings.KEYCLOAK_REALM}/.well-known/openid-configuration`;
      try {
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data;
        this.issuer = data.issuer;
        this.tokenEndpoint = data.token_endpoint;
        return;
      } catch (error) {
        lastError = error;
        console.error('[Auth] Keycloak discover error:', lastError?.response?.data || lastError?.message);
      }
    }

    const discoveryUrls = candidates
      .map(baseUrl => `${baseUrl}/realms/${settings.KEYCLOAK_REALM}/.well-known/openid-configuration`)
      .join(', ');
    const message = lastError?.response?.status === 404
      ? `Keycloak discovery falló con 404. URLs probadas: ${discoveryUrls}`
      : lastError?.message || `No se pudo descubrir Keycloak. URLs probadas: ${discoveryUrls}`;
    throw new Error(message);
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
      console.error('[Auth] Keycloak login error:', error?.response?.data || error.message);
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
  const publicApiRoutes = ['/api/clientes', '/api/vehiculos', '/api/ordenes', '/api/inventario', '/api/pagos'];
  
  // Verificar rutas exactas o que comiencen con las rutas públicas
  const isExcluded = excludePaths.includes(req.path) || 
                     publicApiRoutes.some(route => req.path === route || req.path.startsWith(route + '/'));
  
  // En modo desarrollo, asignar roles a todas las solicitudes (incluso públicas)
  if (settings.APP_ENV === 'development') {
    console.log(`[AUTH BYPASS] Desarrollo mode activado - ${req.method} ${req.path}`);
    req.user = { preferred_username: 'dev-user', sub: 'dev-user' };
    req.roles = new Set(['admin', 'recepcionista', 'cajero', 'gerencia', 'mecanico', 'almacen']);
    return next();
  }
  
  if (isExcluded) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[AUTH REJECTED] Sin token - ${req.method} ${req.path}`);
    // Evento: acceso sin token
    try {
      sendEvent('seguridad.accesos', {
        tipo: 'acceso_sin_token',
        endpoint: req.path,
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (error) {
      console.error('Error enviando evento acceso_sin_token:', error.message);
    }
    return res.status(401).json({ detail: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  console.log(`[AUTH VERIFYING] Token recibido - ${req.method} ${req.path}`);
  keycloakOidc.verifyToken(token)
    .then(payload => {
      req.user = payload;
      req.roles = extractRoles(payload);
      console.log(`[AUTH SUCCESS] Usuario: ${payload.preferred_username || payload.sub} - ${req.method} ${req.path}`);
      // Evento: acceso válido
      try {
        sendEvent('seguridad.accesos', {
          tipo: 'acceso_valido',
          usuario: payload.preferred_username || payload.sub,
          endpoint: req.path
        });
      } catch (error) {
        console.error('Error enviando evento acceso_valido:', error.message);
      }
      next();
    })
    .catch(error => {
      console.log(`[AUTH FAILED] Error en token - ${req.method} ${req.path}: ${error.message}`);
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