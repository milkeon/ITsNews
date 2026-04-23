import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'local-api-simulator',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // 1. /api/crawl 시뮬레이션
            if (req.url.startsWith('/api/crawl')) {
              const urlObj = new URL(req.url, `http://${req.headers.host}`);
              const targetUrl = urlObj.searchParams.get('url');
              if (!targetUrl) return next();

                try {
                  console.log(`[Crawl Request] ${targetUrl}`);
                  const response = await fetch(targetUrl, {
                    headers: { 
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    }
                  });
                  
                  const contentType = response.headers.get('content-type');
                  const arrayBuffer = await response.arrayBuffer();
                  let html = '';
                  
                  // 인코딩 감지 및 디코딩
                  if (contentType && contentType.toLowerCase().includes('euc-kr')) {
                    html = new TextDecoder('euc-kr').decode(arrayBuffer);
                  } else {
                    html = new TextDecoder('utf-8').decode(arrayBuffer);
                  }

                  if (!response.ok) console.error(`[Crawl Error] Status ${response.status} for ${targetUrl}`);
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ html, status: response.status }));
                } catch (err) {
                  console.error(`[Crawl Fatal] ${err.message}`);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      proxy: {
        // Notion API 프록시 (헤더 주입만 수행)
        '/api/notion': {
          target: 'https://api.notion.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/notion/, '/v1'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_NOTION_API_KEY}`);
              proxyReq.setHeader('Notion-Version', '2022-06-28');
            });
          }
        },
        '/proxy/yozm': { target: 'https://yozm.wishket.com', changeOrigin: true, rewrite: (path) => path.replace(/^\/proxy\/yozm/, '') },
        '/proxy/geek': { target: 'https://news.hada.io', changeOrigin: true, rewrite: (path) => path.replace(/^\/proxy\/geek/, '') },
        '/proxy/itworld': { target: 'https://www.itworld.co.kr', changeOrigin: true, rewrite: (path) => path.replace(/^\/proxy\/itworld/, '') }
      }
    }
  }
})
