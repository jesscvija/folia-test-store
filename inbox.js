// Vercel serverless function — fetches inbox messages for a user from CIO App API
// Hardcoded to the solutions demo workspace

const CIO_APP_API_KEY = '0a0c32e76237dbadd42f2afe3e954513';
const CIO_ENVIRONMENT_ID = '126697';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required' });

  try {
    const url = new URL(`https://api.customer.io/v1/environments/${CIO_ENVIRONMENT_ID}/deliveries`);
    url.searchParams.set('customer_id', email);
    url.searchParams.set('type', 'in_app');
    url.searchParams.set('size', '20');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${CIO_APP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    const messages = (data.deliveries || [])
      .filter(d => d.sent_at)
      .map(d => ({
        id: d.id,
        title: d.subject || d.preview || 'New notification',
        body: d.body || d.preview || '',
        sent_at: d.sent_at,
        read: false
      }))
      .slice(0, 10);

    return res.status(200).json({ messages });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
