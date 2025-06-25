// server.js
const { createServer } = require("http");
const next = require("next");

// Optionally load global env vars (for API keys etc.)
require("dotenv").config();

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // No per-request env file loading!
    handle(req, res);
  }).listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
