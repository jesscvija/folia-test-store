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

  // Parse body manually if needed
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { plant, user, source, action } = body || {};
  if (!plant || !user) return res.status(400).json({ error: 'plant and user required' });

  try {
    // Step 1: Look up person by email
    const encodedEmail = user.email.replace(/\+/g, '%2B').replace(/@/g, '%40');
    const personRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/customers?email=${encodedEmail}`,
      { headers: authHeaders }
    );
    const personData = await personRes.json();
    const person = personData.customers?.[0];
    if (!person) {
      return res.status(200).json({ ok: false, reason: 'person_not_found', email: user.email });
    }
    const personId = person.id;

    // Step 2: Look up object's internal id
    const objectRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/object_types/1/objects/${plant.id}`,
      { headers: authHeaders }
    );
    if (!objectRes.ok) {
      return res.status(200).json({ ok: false, reason: 'object_not_found', plant_id: plant.id });
    }
    const objectData = await objectRes.json();
    const objectId = objectData.object?.id;
    if (!objectId) {
      return res.status(200).json({ ok: false, reason: 'object_id_missing' });
    }

    // Step 3: Create or delete relationship
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

    return res.status(200).json({
      ok: relRes.ok,
      status: relRes.status,
      personId,
      objectId,
      response: relText
    });

  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
};
