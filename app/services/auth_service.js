const { keycloakOidc } = require('../core/security');

class AuthService {
  async login(username, password) {
    return await keycloakOidc.login(username, password);
  }
}

module.exports = AuthService;