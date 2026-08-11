const { auth, requiresAuth } = require('express-openid-connect');

function getAuthConfig() {
  const secret = process.env.AUTH0_SECRET;
  const baseURL = process.env.AUTH0_BASE_URL;
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;
  const clientID = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;

  const missing = [
    !secret && 'AUTH0_SECRET',
    !baseURL && 'AUTH0_BASE_URL',
    !issuerBaseURL && 'AUTH0_ISSUER_BASE_URL',
    !clientID && 'AUTH0_CLIENT_ID',
    !clientSecret && 'AUTH0_CLIENT_SECRET',
  ].filter(Boolean);

  if (missing.length) {
    return { enabled: false, missing };
  }

  return {
    enabled: true,
    middleware: auth({
      authRequired: false,
      auth0Logout: true,
      secret,
      baseURL,
      issuerBaseURL,
      clientID,
      clientSecret,
      authorizationParams: {
        response_type: 'code',
        response_mode: 'query',
      },
    }),
  };
}

function getUserDisplayName(user) {
  if (!user) {
    return '';
  }

  return user.name || user.nickname || user.email || 'Signed-in wanderer';
}

function requireAuthIfEnabled(authEnabled) {
  const guard = requiresAuth();

  return (req, res, next) => {
    if (!authEnabled) {
      return res.status(503).redirect('/');
    }

    return guard(req, res, next);
  };
}

module.exports = {
  getAuthConfig,
  getUserDisplayName,
  requireAuthIfEnabled,
};
