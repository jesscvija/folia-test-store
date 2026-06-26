// Vercel serverless function — creates a Plant object relationship in CIO
// CX Demo workspace (223821)

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

  const { plant, user, source, action } = req.body;
  if (!plant || !user) return res.status(400).json({ error: 'plant and user required' });

  try {
    // Step 1: Look up person's internal id by email
    const personRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/customers?email=${encodeURIComponent(user.email)}`,
      { headers: authHeaders }
    );
    if (!personRes.ok) return res.status(personRes.status).json({ error: 'Person lookup failed' });
    const personData = await personRes.json();
    const person = personData.customers?.[0];
    if (!person) return res.status(404).json({ error: 'Person not found in CIO' });
    const personId = person.id; // raw hex internal id

    // Step 2: Look up object's internal id
    const objectRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/object_types/1/objects/${plant.id}`,
      { headers: authHeaders }
    );
    if (!objectRes.ok) return res.status(objectRes.status).json({ error: 'Object lookup failed' });
    const objectData = await objectRes.json();
    const objectId = objectData.object?.id; // ob-prefixed internal id
    if (!objectId) return res.status(404).json({ error: 'Object not found in CIO' });

    // Step 3: Create or delete relationship
    const method = action === 'unsaved' ? 'DELETE' : 'POST';
    const body = {
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
      { method, headers: authHeaders, body: JSON.stringify(body) }
    );

    if (!relRes.ok) {
      const err = await relRes.text();
      return res.status(relRes.status).json({ error: err });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
