// server.js
const { createServer } = require("http");
const next = require("next");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const app = next({ dev: false });
const handle = app.getRequestHandler();

/**
 * Extracts the subdomain from a host string.
 * Returns null for root domain, 'www', or invalid hosts.
 */
function getSubdomain(hostname) {
  if (!hostname) return null;
  // Remove port if present
  hostname = hostname.split(':')[0];
  if (hostname === "priority-hub.com" || hostname === "www.priority-hub.com") {
    return null; // root or www
  }
  if (hostname.endsWith('.priority-hub.com')) {
    const sub = hostname.replace('.priority-hub.com', '');
    // Remove trailing dot if present
    return sub.replace(/\.$/, '') || null;
  }
  return null;
}

/**
 * Loads the correct .env file for the given subdomain or root.
 */
function loadTenantEnv(subdomain) {
  let envPath;
  if (!subdomain) {
    // Root domain fallback
    envPath = path.join(__dirname, 'envs', `.env.root`);
  } else {
    envPath = path.join(__dirname, 'envs', `.env.${subdomain}`);
  }
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`[server.js] Loaded env: ${envPath}`);
  } else {
    console.warn(`[server.js] WARNING: Env file not found: ${envPath}`);
  }
}

app.prepare().then(() => {
  createServer((req, res) => {
    const host = req.headers.host;
    const subdomain = getSubdomain(host);

    loadTenantEnv(subdomain);

    handle(req, res);
  }).listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
