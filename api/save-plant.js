// Vercel serverless function — creates a Plant object relationship in CIO
// CX Demo workspace (223821)

const CIO_APP_API_KEY = 'b50179c68d7b16476a11b0e524eb17be';
const CIO_ENV_ID = '223821';
const BASE = 'https://api.customer.io/v1';

const headers = {
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
    // Step 1: Look up the person's internal cio_id by email
    const personRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/customers?email=${encodeURIComponent(user.email)}`,
      { headers }
    );
    if (!personRes.ok) {
      const err = await personRes.text();
      return res.status(personRes.status).json({ error: `Person lookup failed: ${err}` });
    }
    const personData = await personRes.json();
    const person = personData.customers?.[0];
    if (!person) return res.status(404).json({ error: 'Person not found in CIO' });
    const cioPersonId = person.cio_id;

    // Step 2: Look up the object's internal cio_object_id
    const objectRes = await fetch(
      `${BASE}/environments/${CIO_ENV_ID}/object_types/1/objects/${plant.id}`,
      { headers }
    );
    if (!objectRes.ok) {
      const err = await objectRes.text();
      return res.status(objectRes.status).json({ error: `Object lookup failed: ${err}` });
    }
    const objectData = await objectRes.json();
    const cioObjectId = objectData.object?.cio_object_id || objectData.cio_object_id;
    if (!cioObjectId) return res.status(404).json({ error: 'Object not found in CIO' });

    // Step 3: Create or delete the relationship
    if (action === 'unsaved') {
      const delRes = await fetch(
        `${BASE}/environments/${CIO_ENV_ID}/relationships`,
        {
          method: 'DELETE',
          headers,
          body: JSON.stringify({
            relationships: [{
              entity1: { type: 'customer', identifier: 'cio_id', value: cioPersonId },
              entity2: { type: 'object', identifier: 'cio_object_id', value: cioObjectId }
            }]
          })
        }
      );
      if (!delRes.ok) {
        const err = await delRes.text();
        return res.status(delRes.status).json({ error: err });
      }
    } else {
      const relRes = await fetch(
        `${BASE}/environments/${CIO_ENV_ID}/relationships`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            relationships: [{
              entity1: { type: 'customer', identifier: 'cio_id', value: cioPersonId },
              entity2: { type: 'object', identifier: 'cio_object_id', value: cioObjectId },
              attributes: {
                saved_at: Math.floor(Date.now() / 1000),
                source: source || 'store',
                purchased: false
              }
            }]
          })
        }
      );
      if (!relRes.ok) {
        const err = await relRes.text();
        return res.status(relRes.status).json({ error: err });
      }
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
