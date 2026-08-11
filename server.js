require('dotenv').config();

const express = require('express');
const path = require('path');
const { renderPage } = require('./lib/render');
const { getAuthConfig, requireAuthIfEnabled } = require('./lib/auth');
const {
  getSupabaseConfig,
  checkConnection,
  fetchNotes,
  insertNote,
} = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;
const authConfig = getAuthConfig();

if (!authConfig.enabled) {
  console.warn(
    'Auth0 is not fully configured yet. Missing:',
    authConfig.missing.join(', ')
  );
} else {
  app.use(authConfig.middleware);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

async function loadPageData() {
  const { client, missingEnv } = getSupabaseConfig();

  if (missingEnv || !client) {
    return { connected: false, notes: [] };
  }

  const connected = await checkConnection(client);

  if (!connected) {
    return { connected: false, notes: [] };
  }

  const notes = await fetchNotes(client);
  return { connected: true, notes };
}

function renderHomePage(res, options = {}) {
  return loadPageData()
    .then(({ connected, notes }) => {
      const page = renderPage({
        connected,
        notes,
        authEnabled: authConfig.enabled,
        user: options.user ?? null,
        flash: options.flash,
      });
      res.type('html').send(page);
    })
    .catch((error) => {
      console.error('Failed to load home page:', error.message);
      const page = renderPage({
        connected: false,
        notes: [],
        authEnabled: authConfig.enabled,
        user: options.user ?? null,
        flash: options.flash,
      });
      res.type('html').send(page);
    });
}

app.get('/', async (req, res) => {
  await renderHomePage(res, { user: req.oidc?.user ?? null });
});

app.post('/notes', requireAuthIfEnabled(authConfig.enabled), async (req, res) => {
  const name = String(req.body.name || '').trim();
  const message = String(req.body.message || '').trim();
  const user = req.oidc?.user ?? null;

  if (!name || !message) {
    const { connected, notes } = await loadPageData();
    return res
      .status(400)
      .type('html')
      .send(
        renderPage({
          connected,
          notes,
          authEnabled: authConfig.enabled,
          user,
          flash: { type: 'error', message: 'Please enter both a name and a message.' },
        })
      );
  }

  const { client, missingEnv } = getSupabaseConfig();

  if (missingEnv || !client) {
    const page = renderPage({
      connected: false,
      notes: [],
      authEnabled: authConfig.enabled,
      user,
      flash: {
        type: 'error',
        message: 'Database is not connected yet. Finish Session 2 setup first.',
      },
    });
    return res.status(503).type('html').send(page);
  }

  const connected = await checkConnection(client);

  if (!connected) {
    const page = renderPage({
      connected: false,
      notes: [],
      authEnabled: authConfig.enabled,
      user,
      flash: {
        type: 'error',
        message: 'Database is not connected yet. Finish Session 2 setup first.',
      },
    });
    return res.status(503).type('html').send(page);
  }

  try {
    await insertNote(client, { name, message });
    return res.redirect('/');
  } catch (error) {
    console.error('Failed to save note:', error.message);
    const notes = await fetchNotes(client).catch(() => []);
    const page = renderPage({
      connected: true,
      notes,
      authEnabled: authConfig.enabled,
      user,
      flash: { type: 'error', message: 'Could not save your note. Please try again.' },
    });
    return res.status(500).type('html').send(page);
  }
});

app.listen(PORT, () => {
  console.log(`Dev Lab is running at http://localhost:${PORT}`);
});
