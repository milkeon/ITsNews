export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, method, payload } = req.body;
  
  // Vercel 환경 변수 읽기
  const NOTION_API_KEY = process.env.VITE_NOTION_API_KEY;
  const NOTION_DB_ID = process.env.VITE_NOTION_DB_ID;

  if (!NOTION_API_KEY || !NOTION_DB_ID) {
    return res.status(500).json({ error: 'Missing Notion Environment Variables on Vercel' });
  }

  // endpoint 설정 로직
  let url = `https://api.notion.com/v1/${endpoint}`;
  if (endpoint === 'databases/query') {
    url = `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`;
  }

  const options = {
    method: method || 'GET',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  };

  if (payload) {
    // payload 내에 properties만 올 경우 parent 객체를 주입해준다
    if (endpoint === 'pages' && !payload.parent) {
      payload.parent = { database_id: NOTION_DB_ID };
    }
    options.body = JSON.stringify(payload);
  } else if (method === 'POST' || method === 'PATCH') {
    // Notion API는 POST/PATCH 시 빈 body라도 명시해줘야 할 때가 있음
    options.body = JSON.stringify({});
  }

  try {
    const notionRes = await fetch(url, options);
    const data = await notionRes.json();
    return res.status(notionRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
