const IS_DEV = import.meta.env.DEV;
const API_ROUTE = '/api/notion';

// Notion 관련 환경 변수 (Vite는 VITE_ 접두사가 붙으면 클라이언트에서도 접근 가능)
const NOTION_API_KEY = import.meta.env.VITE_NOTION_API_KEY;
const NOTION_DB_ID = import.meta.env.VITE_NOTION_DB_ID;

export const fetchAllNotionData = async () => {
  try {
    let res;
    if (IS_DEV) {
      // 로컬에서는 프록시(/api/notion)를 통해 직접 호출 (CORS 회피)
      res = await fetch(`/api/notion/databases/${NOTION_DB_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });
    } else {
      // 배포 환경에서는 서버리스 함수 호출
      res = await fetch(API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'databases/query', method: 'POST' })
      });
    }
    if (!res.ok) throw new Error('Notion API Error');
    const data = await res.json();
    
    if (data.error) {
      console.error('Notion Error:', data.error);
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
          likedAt: new Date(page.created_time).getTime(),
          hidden
        });
      } else if (type === 'Keyword') {
        keywords.push({
          id: page.id,
          text: page.properties.Name?.title?.[0]?.plain_text || '',
          likedAt: new Date(page.created_time).getTime(),
          hidden
        });
      } else if (type === 'Article') {
        const props = page.properties;
        // 다양한 가능한 이미지 속성명 확인
        const imageProp = props.Image || props.Thumbnail || props.imageUrl || props['이미지'] || props['썸네일'];
        const img = imageProp?.url || imageProp?.files?.[0]?.file?.url || imageProp?.files?.[0]?.external?.url || '';
        
        articles.push({
          id: page.properties.URL?.url || page.id,
          notionPageId: page.id,
          title: page.properties.Name?.title?.[0]?.plain_text || '',
          url: page.properties.URL?.url || '',
          summary: '', 
          date: page.properties.PublishedAt?.rich_text?.[0]?.plain_text || '',
          author: page.properties.Publisher?.rich_text?.[0]?.plain_text || '',
          source: page.properties.Publisher?.rich_text?.[0]?.plain_text || '', // source 필드 추가
          imageUrl: img,
          img: img,
          likedAt: new Date(page.created_time).getTime(),
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
    let res;
    const payload = {
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Type: { select: { name: 'Source' } },
        URL: { url: url },
        Hidden: { checkbox: false },
        CreatedAt: { date: { start: new Date().toISOString() } }
      }
    };

    if (IS_DEV) {
      res = await fetch(`/api/notion/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'pages', method: 'POST', payload })
      });
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Failed to add source to Notion:', error);
    return null;
  }
};

export const addKeywordToNotion = async (text) => {
  try {
    let res;
    const payload = {
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Name: { title: [{ text: { content: text } }] },
        Type: { select: { name: 'Keyword' } },
        Hidden: { checkbox: false },
        CreatedAt: { date: { start: new Date().toISOString() } }
      }
    };

    if (IS_DEV) {
      res = await fetch(`/api/notion/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'pages', method: 'POST', payload })
      });
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Failed to add keyword to Notion:', error);
    return null;
  }
};

export const addArticleToNotion = async (article) => {
  try {
    let res;
    const payload = {
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Name: { title: [{ text: { content: article.title || '' } }] },
        Type: { select: { name: 'Article' } },
        URL: { url: article.url || null },
        Image: { url: article.img || article.imageUrl || null },
        Publisher: { rich_text: [{ text: { content: article.author || article.source || '' } }] },
        PublishedAt: { rich_text: [{ text: { content: article.date || '' } }] },
        Hidden: { checkbox: false },
        CreatedAt: { date: { start: new Date().toISOString() } }
      }
    };

    if (IS_DEV) {
      res = await fetch(`/api/notion/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'pages', method: 'POST', payload })
      });
    }
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
    const payload = {
      properties: {
        Hidden: { checkbox: true }
      }
    };

    if (IS_DEV) {
      await fetch(`/api/notion/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: `pages/${pageId}`,
          method: 'PATCH',
          payload
        })
      });
    }
  } catch (error) {
    console.error('Failed to hide page in Notion:', error);
  }
};

export const unhideNotionPage = async (pageId) => {
  if (!pageId || pageId.toString().length < 10) return;
  try {
    const payload = {
      properties: {
        Hidden: { checkbox: false }
      }
    };

    if (IS_DEV) {
      await fetch(`/api/notion/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: `pages/${pageId}`,
          method: 'PATCH',
          payload
        })
      });
    }
  } catch (error) {
    console.error('Failed to unhide page in Notion:', error);
  }
};
