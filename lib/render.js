const { getUserDisplayName } = require('./auth');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString();
}

function renderNotes(notes) {
  if (!notes.length) {
    return '<p class="empty-state">The forest clearing is quiet — leave the first trail note.</p>';
  }

  return notes
    .map(
      (note) => `
        <article class="note-card">
          <header class="note-header">
            <strong>${escapeHtml(note.name)}</strong>
            <time datetime="${escapeHtml(note.created_at)}">${escapeHtml(formatDate(note.created_at))}</time>
          </header>
          <p>${escapeHtml(note.message)}</p>
        </article>
      `
    )
    .join('');
}

function renderAuthBar({ authEnabled, user }) {
  if (!authEnabled) {
    return `
      <div class="auth-bar auth-bar--warning">
        <p>Auth0 is not configured yet. Add the five Auth0 variables to your 1Password Environment.</p>
      </div>
    `;
  }

  if (user) {
    return `
      <div class="auth-bar auth-bar--signed-in">
        <p>Signed in as <strong>${escapeHtml(getUserDisplayName(user))}</strong></p>
        <a class="auth-link" href="/logout">Leave the grove</a>
      </div>
    `;
  }

  return `
    <div class="auth-bar auth-bar--signed-out">
      <p>Only signed-in wanderers can pin notes to the board.</p>
      <a class="auth-link auth-link--primary" href="/login">Enter the grove</a>
    </div>
  `;
}

function renderPage({ connected, notes, flash, authEnabled = false, user = null }) {
  const badgeClass = connected ? 'badge badge--connected' : 'badge badge--disconnected';
  const badgeText = connected ? 'Connected' : 'Database not connected';
  const isAuthenticated = Boolean(user);
  const canPost = connected && authEnabled && isAuthenticated;
  const formDisabled = canPost ? '' : 'disabled';
  const defaultName = isAuthenticated ? escapeHtml(getUserDisplayName(user)) : '';

  let helperText = 'Pin a short note to the forest board for every wanderer to read.';

  if (!connected) {
    helperText = 'The grove is waiting — posting opens once the database connection is rooted (Session 2).';
  } else if (!authEnabled) {
    helperText = 'Finish Auth0 setup in 1Password, then restart the app to enable login.';
  } else if (!isAuthenticated) {
    helperText = 'Sign in first — posting a note requires an authenticated wanderer (Session 3).';
  }

  const flashHtml = flash
    ? `<div class="flash flash--${escapeHtml(flash.type)}">${escapeHtml(flash.message)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dev Lab — Forest Grove</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="page">
      <header class="site-header">
        <div>
          <p class="brand-mark" aria-hidden="true">🌲🍃</p>
          <p class="eyebrow">Session 3 · Forest Grove</p>
          <h1>Dev Lab</h1>
          <p class="subtitle">A woodland note board where signed-in wanderers leave messages among the trees.</p>
        </div>
        <div class="${badgeClass}" role="status" aria-live="polite">
          <span class="badge__dot" aria-hidden="true"></span>
          ${badgeText}
        </div>
      </header>

      ${renderAuthBar({ authEnabled, user })}

      ${flashHtml}

      <section class="panel">
        <h2>🌿 Leave a trail note</h2>
        <p class="helper-text">${helperText}</p>
        <form class="note-form" method="post" action="/notes">
          <label>
            Your name
            <input type="text" name="name" maxlength="80" value="${defaultName}" required ${formDisabled} />
          </label>
          <label>
            Message
            <textarea name="message" rows="3" maxlength="280" required ${formDisabled}></textarea>
          </label>
          <button type="submit" ${formDisabled}>Pin to the grove</button>
        </form>
      </section>

      <section class="panel panel--notes">
        <h2>🪵 Notes on the forest board</h2>
        <div class="notes-list">
          ${renderNotes(notes)}
        </div>
      </section>
    </main>
  </body>
</html>`;
}

module.exports = { renderPage };
