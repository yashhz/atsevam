/**
 * ATSEVAM — Shopify OAuth Token Generator
 * Run once to get an Admin API access token:
 *
 *   node scripts/auth.mjs
 *
 * Opens your browser for OAuth → saves token to scripts/.token
 */

import http from 'http';
import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import { createHash, randomBytes } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────
// Set these in your shell or in a .env.local file before running:
//   SHOPIFY_APP_CLIENT_ID=...  SHOPIFY_APP_CLIENT_SECRET=...  node scripts/auth.mjs
const SHOP          = process.env.SHOPIFY_STORE_DOMAIN   || 'atsevam.myshopify.com';
const CLIENT_ID     = process.env.SHOPIFY_APP_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.SHOPIFY_APP_CLIENT_SECRET || '';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Missing credentials. Set env vars:\n');
  console.error('   SHOPIFY_APP_CLIENT_ID=<your-client-id>');
  console.error('   SHOPIFY_APP_CLIENT_SECRET=<your-client-secret>\n');
  process.exit(1);
}
const REDIRECT_URI  = 'http://localhost:3001/auth/callback';
const PORT          = 3001;
const TOKEN_FILE    = path.join(__dirname, '.token');
// ──────────────────────────────────────────────────────────────────

// Generate a random state for CSRF protection
const state = randomBytes(16).toString('hex');

// Build the authorization URL
const authUrl = new URL(`https://${SHOP}/admin/oauth/authorize`);
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('state', state);

console.log('\n🔐 Atsevam — Shopify OAuth\n');
console.log('Opening browser for authorization...');
console.log('If browser does not open, visit:\n');
console.log(authUrl.toString() + '\n');

// Open browser (Windows / Mac / Linux)
const openCmd = process.platform === 'win32'
  ? `start "" "${authUrl.toString()}"`
  : process.platform === 'darwin'
    ? `open "${authUrl.toString()}"`
    : `xdg-open "${authUrl.toString()}"`;

exec(openCmd);

// Start local server to capture the OAuth callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname !== '/auth/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const returnedState = url.searchParams.get('state');
  const code          = url.searchParams.get('code');
  const error         = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end(`<h2>❌ OAuth Error: ${error}</h2><p>You can close this tab.</p>`);
    server.close();
    process.exit(1);
  }

  if (returnedState !== state) {
    res.writeHead(403, {'Content-Type': 'text/html'});
    res.end(`<h2>❌ State mismatch — possible CSRF</h2><p>You can close this tab.</p>`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end(`<h2>❌ No code received</h2><p>You can close this tab.</p>`);
    server.close();
    process.exit(1);
  }

  // Exchange code for access token
  console.log('✅ Authorization code received — exchanging for token...');

  try {
    const tokenRes = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      throw new Error(JSON.stringify(data));
    }

    // Save token to file
    writeFileSync(TOKEN_FILE, data.access_token, 'utf8');

    console.log('\n✅ Token saved to scripts/.token');
    console.log('Scopes granted:', data.scope);
    console.log('\n▶  Now run: node scripts/set-prices.mjs --dry-run\n');

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h1>✅ Authorized!</h1>
        <p>Token saved. You can close this tab and return to your terminal.</p>
      </body></html>
    `);

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Token exchange failed:', err.message);
    res.writeHead(500, {'Content-Type': 'text/html'});
    res.end(`<h2>❌ Token exchange failed</h2><pre>${err.message}</pre>`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT} for OAuth callback...`);
});
