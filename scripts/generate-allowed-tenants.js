const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, '../envs');
const files = fs.readdirSync(envDir);

const allowedTenants = files
  .filter(f => f.startsWith('.env.'))
  .map(f => f.replace('.env.', ''));

fs.writeFileSync(
  path.join(__dirname, '../allowed-tenants.json'),
  JSON.stringify(allowedTenants)
);

console.log('allowed-tenants.json generated:', allowedTenants);
