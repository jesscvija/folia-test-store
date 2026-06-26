const CIO_APP_API_KEY = 'b50179c68d7b16476a11b0e524eb17be';
const CIO_ENV_ID = '223821';
const BASE = 'https://api.customer.io/v1';

const authHeaders = {
  'Authorization': `Bearer ${CIO_APP_API_KEY}`,
  'Content-Type': 'application/json'
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vercel auto-parses JSON bodies — use req.body directly
  const { plant, user, source, action } = req.body || {};
  if (!plant || !user) return res.status(400).json({ error: 'plant and user required', body: typeof req.body });

  try {
    const encodedEmail = user.email.replace(/\+/g, '%2B').replace(/@/g, '%40');
    const personRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/customers?email=${encodedEmail}`,
      { headers: authHeaders }
    );
    const personData = await personRes.json();
    const person = personData.customers?.[0];
    if (!person) return res.status(200).json({ ok: false, reason: 'person_not_found' });
    const personId = person.id;

    const objectRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/object_types/1/objects/${plant.id}`,
      { headers: authHeaders }
    );
    if (!objectRes.ok) return res.status(200).json({ ok: false, reason: 'object_not_found' });
    const objectData = await objectRes.json();
    const objectId = objectData.object?.id;
    if (!objectId) return res.status(200).json({ ok: false, reason: 'object_id_missing' });

    const method = action === 'unsaved' ? 'DELETE' : 'POST';
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

    const relRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/relationships`,
      { method, headers: authHeaders, body: JSON.stringify(relBody) }
    );

    const relText = await relRes.text();
    return res.status(200).json({ ok: relRes.ok, status: relRes.status, personId, objectId, response: relText });

  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message, stack: err.stack?.slice(0,200) });
  }
};
