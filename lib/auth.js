const { auth, requiresAuth } = require('express-openid-connect');

function resolveAuth0BaseURL() {
  let baseURL = (process.env.AUTH0_BASE_URL || '').trim().replace(/\/+$/, '');

  // On Vercel, fall back to the deployment host if AUTH0_BASE_URL is missing or still localhost.
  if (process.env.VERCEL && process.env.VERCEL_URL) {
    const vercelBase = `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
    if (!baseURL || baseURL.includes('localhost')) {
      baseURL = vercelBase;
    }
  }

  return baseURL;
}

function getAuthConfig() {
  const secret = process.env.AUTH0_SECRET;
  const baseURL = resolveAuth0BaseURL();
  const issuerBaseURL = (process.env.AUTH0_ISSUER_BASE_URL || '').trim().replace(/\/+$/, '');
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
      session: {
        cookie: {
          secure: Boolean(process.env.VERCEL),
        },
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
