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

  const { plant, user, source, action } = req.body || {};
  if (!plant || !user) return res.status(400).json({ error: 'plant and user required' });

  try {
    // Step 1: Look up person by their external ID (email used as id in identify)
    // Use the customer_id path param instead of email search to avoid encoding issues
    const personRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/customers/${encodeURIComponent(user.email)}`,
      { headers: authHeaders }
    );
    const personText = await personRes.text();
    if (!personRes.ok) {
      return res.status(200).json({ ok: false, reason: 'person_lookup_failed', status: personRes.status, detail: personText.slice(0, 200) });
    }
    const personData = JSON.parse(personText);
    const personId = personData.customer?.id || personData.id;
    if (!personId) return res.status(200).json({ ok: false, reason: 'person_id_missing', data: personText.slice(0, 200) });

    // Step 2: Look up object's internal id
    const objectRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/object_types/1/objects/${plant.id}`,
      { headers: authHeaders }
    );
    const objectText = await objectRes.text();
    if (!objectRes.ok) return res.status(200).json({ ok: false, reason: 'object_not_found', detail: objectText.slice(0, 200) });
    const objectData = JSON.parse(objectText);
    const objectId = objectData.object?.id;
    if (!objectId) return res.status(200).json({ ok: false, reason: 'object_id_missing' });

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

    return res.status(200).json({ ok: relRes.ok, status: relRes.status, personId, objectId, response: relText.slice(0, 200) });

  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
};
