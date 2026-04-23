const NOTION_API_URL = '/proxy/notion/v1';

const getHeaders = () => ({
  'Authorization': `Bearer ${import.meta.env.VITE_NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
});

export const fetchAllNotionData = async () => {
  const dbId = import.meta.env.VITE_NOTION_DB_ID;
  if (!dbId || !import.meta.env.VITE_NOTION_API_KEY) {
    return { sources: [], keywords: [], articles: [] };
  }

  try {
    const res = await fetch(`${NOTION_API_URL}/databases/${dbId}/query`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Notion API Error');
    const data = await res.json();
    
    const sources = [];
    const keywords = [];
    const articles = [];

    data.results.forEach(page => {
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
        // 기존 코드와의 호환성을 위해 Article 데이터 구조 유지
        articles.push({
          id: page.properties.URL?.url || page.id,
          notionPageId: page.id,
          title: page.properties.Name?.title?.[0]?.plain_text || '',
          url: page.properties.URL?.url || '',
          summary: '', // 통합 스키마에 summary는 없으나 필요하면 publisher나 title로 대체
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
  const dbId = import.meta.env.VITE_NOTION_DB_ID;
  if (!dbId) return null;

  try {
    const res = await fetch(`${NOTION_API_URL}/pages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Type: { select: { name: 'Source' } },
          URL: { url: url },
          Hidden: { checkbox: false },
          CreatedAt: { date: { start: new Date().toISOString() } }
        }
      })
    });
    if (!res.ok) throw new Error('Notion API Error');
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Failed to add source to Notion:', error);
    return null;
  }
};

export const addKeywordToNotion = async (text) => {
  const dbId = import.meta.env.VITE_NOTION_DB_ID;
  if (!dbId) return null;

  try {
    const res = await fetch(`${NOTION_API_URL}/pages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name: { title: [{ text: { content: text } }] },
          Type: { select: { name: 'Keyword' } },
          Hidden: { checkbox: false },
          CreatedAt: { date: { start: new Date().toISOString() } }
        }
      })
    });
    if (!res.ok) throw new Error('Notion API Error');
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Failed to add keyword to Notion:', error);
    return null;
  }
};

export const addArticleToNotion = async (article) => {
  const dbId = import.meta.env.VITE_NOTION_DB_ID;
  if (!dbId) return null;

  try {
    const res = await fetch(`${NOTION_API_URL}/pages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        parent: { database_id: dbId },
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
      })
    });
    if (!res.ok) throw new Error('Notion API Error');
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
    await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        properties: {
          Hidden: { checkbox: true }
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
    await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        properties: {
          Hidden: { checkbox: false }
        }
      })
    });
  } catch (error) {
    console.error('Failed to unhide page in Notion:', error);
  }
};
