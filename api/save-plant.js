const CIO_APP_API_KEY = 'b50179c68d7b16476a11b0e524eb17be';
const CIO_ENV_ID = '223821';
const BASE = 'https://api.customer.io/v1';

const authHeaders = {
  'Authorization': `Bearer ${CIO_APP_API_KEY}`,
  'Content-Type': 'application/json'
};

async function cioGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function cioPost(path, body, method = 'POST') {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders,
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
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
    // Step 1: Find person by email search
    // Per CIO docs: encode @ as %40, + as %2B
    const emailParam = user.email
      .replace(/\+/g, '%2B')
      .replace(/@/g, '%40');

    const { ok: pOk, data: pData } = await cioGet(
      `/environments/${CIO_ENV_ID}/customers?email=${emailParam}`
    );
    if (!pOk || !pData?.customers?.length) {
      return res.status(200).json({ ok: false, reason: 'person_not_found', email: user.email });
    }
    const personId = pData.customers[0].id;

    // Step 2: Get object internal id
    const { ok: oOk, data: oData } = await cioGet(
      `/environments/${CIO_ENV_ID}/object_types/1/objects/${plant.id}`
    );
    if (!oOk || !oData?.object?.id) {
      return res.status(200).json({ ok: false, reason: 'object_not_found', plant_id: plant.id });
    }
    const objectId = oData.object.id;

    // Step 3: Create or remove relationship
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

    const method = action === 'unsaved' ? 'DELETE' : 'POST';
    const { ok: rOk, status: rStatus, data: rData } = await cioPost(
      `/environments/${CIO_ENV_ID}/relationships`,
      relBody,
      method
    );

    return res.status(200).json({ ok: rOk, status: rStatus, personId, objectId, response: rData });

  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
};
