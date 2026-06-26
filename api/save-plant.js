const CIO_APP_API_KEY = 'b50179c68d7b16476a11b0e524eb17be';
const CIO_ENV_ID = '223821';
const BASE = 'https://api.customer.io/v1';

const authHeaders = {
  'Authorization': `Bearer ${CIO_APP_API_KEY}`,
  'Content-Type': 'application/json'
};

async function cioFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders, ...options });
  const text = await res.text();
  let data = null;
  try { data = text && text.trim() ? JSON.parse(text) : null; } catch(e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

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
    // Step 1: Find person by email
    const emailParam = user.email.replace(/\+/g, '%2B').replace(/@/g, '%40');
    const p = await cioFetch(`/environments/${CIO_ENV_ID}/customers?email=${emailParam}`);
    if (!p.ok || !p.data?.customers?.length) {
      return res.status(200).json({ ok: false, reason: 'person_not_found', pStatus: p.status, pData: p.data });
    }
    const personId = p.data.customers[0].id;

    // Step 2: Get object
    const o = await cioFetch(`/environments/${CIO_ENV_ID}/object_types/1/objects/${plant.id}`);
    if (!o.ok || !o.data?.object?.id) {
      return res.status(200).json({ ok: false, reason: 'object_not_found', oStatus: o.status, oData: o.data });
    }
    const objectId = o.data.object.id;

    // Step 3: Create/remove relationship
    const relBody = {
      relationships: [{
        entity1_type: 'customer',
        entity1_id: personId,
        entity2_type: 'object',
        entity2_id: objectId,
        ...(action !== 'unsaved' && {
          attributes: {
            saved_at: Math.floor(Date.now() / 1000),
            source: source || 'store',
            purchased: false
          }
        })
      }]
    };

    const r = await cioFetch(`/environments/${CIO_ENV_ID}/relationships`, {
      method: action === 'unsaved' ? 'DELETE' : 'POST',
      headers: authHeaders,
      body: JSON.stringify(relBody)
    });

    return res.status(200).json({ ok: r.ok, status: r.status, personId, objectId, response: r.data });

  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message, stack: err.stack?.slice(0, 300) });
  }
};
