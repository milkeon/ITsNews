const API_ROUTE = '/api/notion';

export const fetchAllNotionData = async () => {
  try {
    const res = await fetch(API_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'databases/query', method: 'POST' })
    });
    if (!res.ok) throw new Error('Notion API Error via Serverless');
    const data = await res.json();
    
    if (data.error) {
      console.error('Serverless Notion Error:', data.error);
      return { sources: [], keywords: [], articles: [] };
    }
    
    const sources = [];
    const keywords = [];
    const articles = [];

    (data.results || []).forEach(page => {
      const type = page.properties.Type?.select?.name;
      const hidden = page.properties.Hidden?.checkbox || false;
      
      if (type === 'Source') {
        sources.push({
          id: page.id,
          name: page.properties.Name?.title?.[0]?.plain_text || '',
          url: page.properties.URL?.url || '',
          hidden
        });
      } else if (type === 'Keyword') {
        keywords.push({
          id: page.id,
          text: page.properties.Name?.title?.[0]?.plain_text || '',
          hidden
        });
      } else if (type === 'Article') {
        articles.push({
          id: page.properties.URL?.url || page.id,
          notionPageId: page.id,
          title: page.properties.Name?.title?.[0]?.plain_text || '',
          url: page.properties.URL?.url || '',
          summary: '', 
          date: page.properties.PublishedAt?.rich_text?.[0]?.plain_text || '',
          author: page.properties.Publisher?.rich_text?.[0]?.plain_text || '',
          imageUrl: page.properties.Image?.url || '',
          hidden
        });
      }
    });

    return { sources, keywords, articles };
  } catch (error) {
    console.error('Failed to fetch all data from Notion:', error);
    return { sources: [], keywords: [], articles: [] };
  }
};

export const addSourceToNotion = async (name, url) => {
  try {
    const res = await fetch(API_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'pages',
        method: 'POST',
        payload: {
          parent: { database_id: process.env.VITE_NOTION_DB_ID || '' }, // Serverless 내부에서 id 치환 처리하므로 비워도 됨, 하지만 payload에 맞추어 전달.
          // 수정: 서버리스 딴에서 DB ID를 아예 처리하도록 했으나 여기선 payload 자체를 넘겨야 하므로 서버리스 코드를 믿고 parent 부분은 제외하거나 그대로 둘 수 있음.
          // 안정성을 위해 서버리스 함수에서는 pages 엔드포인트 호출 시 payload에 parent: { database_id: NOTION_DB_ID } 가 자동으로 들어가도록 api/notion.js 를 설계하는 것이 좋지만, 
          // 일단 여기서는 Vercel 런타임에러를 막기위해 빈값을 넣고 api/notion.js를 다시 수정하자.
          properties: {
            Name: { title: [{ text: { content: name } }] },
            Type: { select: { name: 'Source' } },
            URL: { url: url },
            Hidden: { checkbox: false },
            CreatedAt: { date: { start: new Date().toISOString() } }
          }
        }
      })
    });
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Failed to add source to Notion:', error);
    return null;
  }
};

export const addKeywordToNotion = async (text) => {
  try {
    const res = await fetch(API_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'pages',
        method: 'POST',
        payload: {
          properties: {
            Name: { title: [{ text: { content: text } }] },
            Type: { select: { name: 'Keyword' } },
            Hidden: { checkbox: false },
            CreatedAt: { date: { start: new Date().toISOString() } }
          }
        }
      })
    });
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Failed to add keyword to Notion:', error);
    return null;
  }
};

export const addArticleToNotion = async (article) => {
  try {
    const res = await fetch(API_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'pages',
        method: 'POST',
        payload: {
          properties: {
            Name: { title: [{ text: { content: article.title || '' } }] },
            Type: { select: { name: 'Article' } },
            URL: { url: article.url || null },
            Image: { url: article.imageUrl || null },
            Publisher: { rich_text: [{ text: { content: article.author || article.source || '' } }] },
            PublishedAt: { rich_text: [{ text: { content: article.date || '' } }] },
            Hidden: { checkbox: false },
            CreatedAt: { date: { start: new Date().toISOString() } }
          }
        }
      })
    });
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Failed to add article to Notion:', error);
    return null;
  }
};

export const hideNotionPage = async (pageId) => {
  if (!pageId || pageId.toString().length < 10) return;
  try {
    await fetch(API_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: `pages/${pageId}`,
        method: 'PATCH',
        payload: {
          properties: {
            Hidden: { checkbox: true }
          }
        }
      })
    });
  } catch (error) {
    console.error('Failed to hide page in Notion:', error);
  }
};

export const unhideNotionPage = async (pageId) => {
  if (!pageId || pageId.toString().length < 10) return;
  try {
    await fetch(API_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: `pages/${pageId}`,
        method: 'PATCH',
        payload: {
          properties: {
            Hidden: { checkbox: false }
          }
        }
      })
    });
  } catch (error) {
    console.error('Failed to unhide page in Notion:', error);
  }
};
