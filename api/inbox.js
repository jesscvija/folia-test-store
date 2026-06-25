// Vercel serverless function — fetches inbox messages for a user from CIO App API
// Solutions demo workspace (126697)

const CIO_APP_API_KEY = 'e0f029f2588ba77d7dcd';
const CIO_ENVIRONMENT_ID = '126697';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required' });

  try {
    // Try both customer_id and recipient to cover both identification methods
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

    // If customer_id gives 404, try recipient filter
    if (response.status === 404) {
      const url2 = new URL(`https://api.customer.io/v1/environments/${CIO_ENVIRONMENT_ID}/deliveries`);
      url2.searchParams.set('recipient', email);
      url2.searchParams.set('type', 'in_app');
      url2.searchParams.set('size', '20');

      const response2 = await fetch(url2.toString(), {
        headers: {
          'Authorization': `Bearer ${CIO_APP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response2.ok) {
        return res.status(200).json({ messages: [] });
      }

      const data2 = await response2.json();
      return res.status(200).json({ messages: shapeMessages(data2.deliveries || []) });
    }

    if (!response.ok) {
      return res.status(200).json({ messages: [] });
    }

    const data = await response.json();
    return res.status(200).json({ messages: shapeMessages(data.deliveries || []) });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function shapeMessages(deliveries) {
  return deliveries
    .filter(d => d.sent_at)
    .map(d => ({
      id: d.id,
      title: d.subject || d.preview || 'New notification',
      body: d.body || d.preview || '',
      sent_at: d.sent_at,
      read: false
    }))
    .slice(0, 10);
}
