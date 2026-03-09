const POLYMARKET_UPSTREAM_URL = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&archived=false&order=volume24hr&ascending=false&limit=24';

module.exports = async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(POLYMARKET_UPSTREAM_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KaizenPolymarketProxy/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Polymarket upstream request failed with ${response.status}`,
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(502).json({ error: 'Unexpected Polymarket response format' });
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to reach Polymarket upstream',
    });
  }
};
