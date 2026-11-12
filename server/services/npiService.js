// Optional first-pass check against the public US NPI Registry (no API key needed).
// It only covers US providers and is a hint for the admin, never an auto-approval.
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, res => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('Unreadable registry response.')); } });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('The registry took too long to respond.')));
  });
}

async function lookup(npi) {
  const data = await fetchJson(`https://npiregistry.cms.hhs.gov/api/?number=${encodeURIComponent(npi)}&version=2.1`);
  if (!data.results || !data.results.length) return { found: false };
  const r = data.results[0];
  const b = r.basic || {};
  return {
    found: true,
    name: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.organization_name || '',
    credential: b.credential || '',
    status: b.status || '',
    taxonomy: (r.taxonomies && r.taxonomies[0] && r.taxonomies[0].desc) || '',
    state: (r.addresses && r.addresses[0] && r.addresses[0].state) || ''
  };
}

module.exports = { lookup };
