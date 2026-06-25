// Vercel serverless function — fetches inbox messages for a user from CIO App API
// Only works for the solutions demo workspace (hardcoded credentials)
// Deploy alongside index.html in the same repo

const CIO_APP_API_KEY = process.env.CIO_APP_API_KEY;
const CIO_ENVIRONMENT_ID = process.env.CIO_ENVIRONMENT_ID;

export default async function handler(req, res) {
  // CORS headers so the store can call this from the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'email query param required' });
  }

  if (!CIO_APP_API_KEY || !CIO_ENVIRONMENT_ID) {
    return res.status(500).json({ error: 'CIO credentials not configured' });
  }

  try {
    // Fetch deliveries for this customer filtered to in_app type
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

    // Filter to inbox-type deliveries and shape the response
    const messages = (data.deliveries || [])
      .filter(d => d.sent_at) // only sent messages
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
