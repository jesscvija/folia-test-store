// Vercel serverless function — creates a Plant object relationship in CIO
// CX Demo workspace (223821) — only called from default workspace

const CIO_APP_API_KEY = 'b50179c68d7b16476a11b0e524eb17be';

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
    const payload = {
      type: 'object',
      identifiers: {
        object_type_id: '1',
        object_id: plant.id
      },
      action: 'identify',
      cio_relationships: [
        {
          identifiers: { email: user.email },
          action: action === 'unsaved' ? 'remove_relationship' : 'add_relationship',
          relationship_attributes: action !== 'unsaved' ? {
            saved_at: Math.floor(Date.now() / 1000),
            source: source || 'store',
            purchased: false
          } : undefined
        }
      ]
    };

    const response = await fetch('https://track.customer.io/api/v2/entity', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CIO_APP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
