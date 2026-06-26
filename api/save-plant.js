// Vercel serverless function — creates a Plant object relationship in CIO
// CX Demo workspace (223821) via Track API v2

const SITE_ID = '28c49653b19139028059';
const API_KEY = '0b0643bd51043c2dd51d';
const BASE = 'https://track.customer.io/api/v2';

// Basic auth header for Track API
const auth = 'Basic ' + Buffer.from(`${SITE_ID}:${API_KEY}`).toString('base64');

const authHeaders = {
  'Authorization': auth,
  'Content-Type': 'application/json'
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plant, user, source, action } = req.body || {};
  if (!plant || !user) return res.status(400).json({ error: 'plant and user required' });

  try {
    const isUnsave = action === 'unsaved';

    const payload = {
      type: 'object',
      identifiers: {
        object_type_id: '1',
        object_id: plant.id
      },
      action: 'identify',
      cio_relationships: isUnsave ? [{
        identifiers: { email: user.email },
        action: 'remove_relationship'
      }] : [{
        identifiers: { email: user.email },
        action: 'add_relationship',
        relationship_attributes: {
          saved_at: Math.floor(Date.now() / 1000),
          source: source || 'store',
          purchased: false
        }
      }]
    };

    const res2 = await fetch(`${BASE}/entity`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload)
    });

    const text = await res2.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch(e) { data = text; }

    return res.status(200).json({ ok: res2.ok, status: res2.status, response: data });

  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
};
