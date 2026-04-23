import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Heart, ExternalLink, Trash2, Plus, ChevronLeft, ChevronRight, Eye, Settings, X } from 'lucide-react';

const mockHottest = [
  { id: 101, title: "[Mock] 오픈AI의 새로운 모델, G-4 오퍼레이션의 파급력", source: "IT동아", url: "https://it.donga.com/", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80" },
  { id: 102, title: "[Mock] 애플 실리콘 M5, 벤치마크 유출 - 한계를 넘다", source: "지디넷", url: "https://zdnet.co.kr/", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80" },
  { id: 103, title: "[Mock] 블록체인의 겨울은 끝났는가? 2026년 대전망", source: "요즘IT", url: "https://yozm.wishket.com/", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80" },
];

const stableImages = [
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80"
];

const knownSites = {
  'news.hada.io': 'GeekNews',
  'itworld.co.kr': 'ITWORLD',
  'yozm.wishket.com': '요즘IT',
  'velog.io': 'Velog',
  'tistory.com': 'Tistory',
  'okky.kr': 'OKKY',
  'maily.so': '뉴스레터'
};

export default function Home() {
  const [masterList, setMasterList] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState('hot');
  
  const observerRef = useRef();
  const timerRef = useRef();
  
  const { 
    articleViews, incrementView, 
    toggleArticleLike, likedArticles, showToast, 
    newsSources, addSource, removeSource,
    cachedMasterList, setCachedMasterList
  } = useStore();
  
  const [sourceInput, setSourceInput] = useState('');
  const [activeSourceFilters, setActiveSourceFilters] = useState([]); 
  const visibleSources = newsSources.filter(s => !s.hidden);

  const toggleSourceFilter = (sourceName) => {
    const isActive = activeSourceFilters.includes(sourceName);
    setActiveSourceFilters(prev => 
      isActive 
        ? prev.filter(s => s !== sourceName) 
        : [...prev, sourceName]
    );
    showToast(`'${sourceName}' 기사가 ${isActive ? '숨겨졌습니다' : '표시됩니다'}.`);
  };

  const formatDisplayName = (name) => {
    if (!name) return '';
    let cleaned = name.trim();
    if (cleaned.includes('지디넷코리아')) return '지디넷코리아';
    
    let isUrl = cleaned.startsWith('http') || cleaned.includes('.com') || cleaned.includes('.kr') || cleaned.includes('.io') || cleaned.includes('.net');
    
    if (isUrl) {
      let host = cleaned.toLowerCase();
      try {
        if (host.startsWith('http')) {
          host = new URL(host).hostname;
        } else {
          host = host.split('/')[0];
        }
        if (host.startsWith('www.')) host = host.substring(4);
      } catch(e) {}
      
      return knownSites[host] || host; 
    }
    return cleaned;
  };

  useEffect(() => {
    if (visibleSources.length === 0) {
      setMasterList([]);
      return;
    }

    // 출처 목록에 변화가 없고 데이터가 이미 있다면 재요청 방지
    if (masterList.length > 0 && [...new Set(masterList.map(a => a.source))].length === visibleSources.length) {
      return;
    }

    const loadData = async () => {
      setLoading(true);

      const sourcePools = await Promise.all(visibleSources.map(async (source) => {
        const cleanName = formatDisplayName(source.name);
        const sourceUrl = source.url || source.name;
        try {
          let targetUrl = sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`;
          
          if (cleanName === '요즘IT') targetUrl = 'https://yozm.wishket.com/magazine/';
          else if (cleanName === 'GeekNews') targetUrl = 'https://news.hada.io/';
          else if (cleanName === 'ITWORLD') targetUrl = 'https://www.itworld.co.kr/';
          
          const fetchAndParse = async (url) => {
            try {
              const res = await fetch(`/api/crawl?url=${encodeURIComponent(url)}`);
              if (!res.ok) return [];
              const data = await res.json();
              const html = data.html || '';
              const doc = new DOMParser().parseFromString(html, 'text/html');
              let results = [];

              // 0. 지디넷코리아 전용 정밀 파싱
              if (cleanName === '지디넷코리아') {
                const items = doc.querySelectorAll('.assetText, .news_item, .view_box');
                items.forEach(item => {
                  const linkEl = item.querySelector('a');
                  if (!linkEl) return;
                  const href = linkEl.getAttribute('href');
                  const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                  if (results.some(r => r.url === fullUrl)) return;
                  
                  if (fullUrl.includes('zdnet.co.kr/news/news_view.asp') || fullUrl.includes('zdnet.co.kr/view/')) {
                    const title = (item.querySelector('h3, .subtitle, .tit') || linkEl).textContent.trim();
                    const summary = (item.querySelector('p, .desc') || {textContent: '지디넷코리아 최신 소식입니다.'}).textContent.trim();
                    const imgEl = item.parentElement?.querySelector('img') || item.querySelector('img');
                    
                    results.push({
                      id: fullUrl,
                      title,
                      source: cleanName,
                      summary,
                      url: fullUrl,
                      img: (imgEl?.getAttribute('src') || stableImages[results.length % stableImages.length]),
                      baseViews: Math.floor(Math.random() * 100)
                    });
                  }
                });
              }

              // 1. JSON 기반 심층 파싱 (__NEXT_DATA__)
              const scriptData = doc.querySelector('script#__NEXT_DATA__');
              if (scriptData) {
                try {
                  const jsonData = JSON.parse(scriptData.textContent);
                  const posts = jsonData?.props?.pageProps?.initialData?.posts || jsonData?.props?.pageProps?.posts;
                  if (posts && Array.isArray(posts)) {
                    posts.slice(0, 20).forEach(post => {
                      const newsletterPath = jsonData?.props?.pageProps?.newsletter?.path || 'mwoji';
                      const pUrl = post.url || `https://maily.so/${newsletterPath}/posts/${post.id}`;
                      results.push({
                        id: pUrl,
                        title: post.title,
                        source: cleanName,
                        summary: post.subTitle || '뉴스레터의 유익한 소식입니다.',
                        url: pUrl,
                        img: post.coverImageUrl || stableImages[results.length % stableImages.length],
                        baseViews: post.viewCount || 0
                      });
                    });
                  }
                } catch(e) {}
              }

              // 2. HTML 링크 기반 파싱
              if (results.length === 0) {
                const links = Array.from(doc.querySelectorAll('a'));
                const articleLinks = links.filter(a => {
                  const h = (a.getAttribute('href') || '').toLowerCase();
                  const t = (a.textContent || '').trim();
                  if (cleanName.includes('뭐지') && h.includes('/posts/')) return true;
                  if (t.length > 8 && !h.includes('javascript:') && !h.includes('#')) {
                    if (h.includes('/posts/') || h.includes('/magazine/') || h.includes('/detail/')) return true;
                  }
                  return false;
                });

                const seen = new Set();
                articleLinks.forEach(a => {
                  const href = a.getAttribute('href');
                  const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                  if (seen.has(fullUrl)) return;
                  seen.add(fullUrl);

                  results.push({
                    id: fullUrl,
                    title: a.textContent.trim().split('\n')[0],
                    source: cleanName,
                    summary: '최신 IT 소식을 확인해보세요.',
                    url: fullUrl,
                    img: stableImages[(results.length + cleanName.length) % stableImages.length],
                    baseViews: Math.floor(Math.random() * 50)
                  });
                });
              }
              return results;
            } catch (err) {
              return [];
            }
          };

          let articles = await fetchAndParse(targetUrl);

          if (articles.length === 0 && (targetUrl.includes('maily.so') || cleanName.includes('뭐지'))) {
            const retryUrl = targetUrl.endsWith('/') ? `${targetUrl}posts` : `${targetUrl}/posts`;
            articles = await fetchAndParse(retryUrl);
          }

          if (articles.length === 0) {
            return [{
              id: `error-${cleanName}`,
              title: `[${cleanName}] 통신 지연: 무작위 기사 대체 중`,
              source: cleanName,
              summary: '대상 사이트로부터 파싱하지 못하여 회색(0) 처리됨',
              url: targetUrl,
              img: stableImages[Math.floor(Math.random() * stableImages.length)],
              baseViews: 0
            }];
          }
          return articles;
        } catch (err) {
          return [];
        }
      }));

      const combined = sourcePools.flat();
      setMasterList(combined);
      setCachedMasterList(combined);
      const allSourceNames = visibleSources.map(s => formatDisplayName(s.name));
      setActiveSourceFilters(allSourceNames);
      setLoading(false);
      setVisibleCount(8);
    };

    loadData();
  }, [newsSources, masterList.length]);

  const filteredList = activeSourceFilters.length === 0 
    ? masterList 
    : masterList.filter(article => activeSourceFilters.includes(article.source));

  const displayList = [...filteredList];
  if (sortBy === 'hot') {
    displayList.sort((a, b) => {
      const valB = (b.baseViews || 0) + (articleViews[b.id] || 0);
      const valA = (a.baseViews || 0) + (articleViews[a.id] || 0);
      return valB - valA;
    });
  }
  const displayArticles = displayList.slice(0, visibleCount);

  const hotList = [...filteredList].sort((a, b) => {
    const valB = (b.baseViews || 0) + (articleViews[b.id] || 0);
    const valA = (a.baseViews || 0) + (articleViews[a.id] || 0);
    return valB - valA;
  });
  const carouselItems = hotList.length >= 3 ? hotList.slice(0, 3) : mockHottest;

  const handleNext = useCallback(() => {
    setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
  }, [carouselItems.length]);

  const handlePrev = useCallback(() => {
    setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  }, [carouselItems.length]);

  useEffect(() => {
    timerRef.current = setInterval(handleNext, 8000); // 8초로 완화
    return () => clearInterval(timerRef.current);
  }, [handleNext]);

  useEffect(() => {
    const options = { root: null, rootMargin: '20px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && visibleCount < displayList.length) {
        setVisibleCount(prev => prev + 4);
      }
    }, options);
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, visibleCount, displayList.length]);

  const availableSources = visibleSources.map(s => formatDisplayName(s.name));

  const handleImageError = (e) => {
    const randomIdx = Math.floor(Math.random() * stableImages.length);
    e.target.src = stableImages[randomIdx];
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ marginBottom: '32px', padding: '16px 0', borderBottom: '1px solid var(--color-outline-variant)', position: 'sticky', top: '0', zIndex: 35, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', whiteSpace: 'nowrap', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary)', marginRight: '8px' }}>필터링:</div>
        {availableSources.map(sourceName => {
          const isActive = activeSourceFilters.includes(sourceName);
          return (
            <button key={sourceName} onClick={() => toggleSourceFilter(sourceName)} style={{ padding: '8px 16px', borderRadius: '100px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0, border: '1px solid', borderColor: isActive ? 'var(--color-primary)' : 'var(--color-outline)', background: isActive ? 'var(--color-primary)' : 'transparent', color: isActive ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)', boxShadow: isActive ? '0 4px 12px rgba(var(--color-primary-rgb), 0.3)' : 'none' }}>
              {sourceName}
            </button>
          );
        })}
        {availableSources.length > 0 && (
          <button onClick={() => setActiveSourceFilters(activeSourceFilters.length === availableSources.length ? [] : availableSources)} style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
            {activeSourceFilters.length === availableSources.length ? '모두 해제' : '모두 선택'}
          </button>
        )}
      </div>

      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} style={{ position: 'fixed', right: '32px', top: '100px', zIndex: 40, background: 'var(--color-surface-container-high)', border: '1px solid var(--color-outline)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-lg)', color: 'var(--color-primary)' }}>
          <Settings size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', marginTop: '2px' }}>출처 관리</span>
        </button>
      )}

      {isSidebarOpen && (
        <>
          <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 45 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', background: 'var(--color-surface)', zIndex: 50, padding: '40px', boxShadow: '-10px 0 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>뉴스 <span className="gradient-text">출처 관리</span></h2>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}><X size={24} /></button>
            </div>
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-on-surface-variant)', marginBottom: '16px' }}>새로운 뉴스 사이트나 블로그 RSS를 추가하세요.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={sourceInput} onChange={(e) => setSourceInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (sourceInput.trim() && (addSource(sourceInput), setSourceInput('')))} placeholder="URL 또는 이름 입력" style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }} autoFocus />
                <button onClick={() => { if (sourceInput.trim()) { addSource(sourceInput); setSourceInput(''); } }} style={{ padding: '0 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: 'var(--color-on-primary)', fontWeight: 'bold', cursor: 'pointer' }}>추가</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: '700' }}>현재 구독 중인 채널 ({visibleSources.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visibleSources.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                    <span style={{ fontWeight: '600' }}>{formatDisplayName(s.name)}</span>
                    <button onClick={() => { if(confirm('정말 삭제하시겠습니까?')) removeSource(s.id); }} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ position: 'relative', height: '500px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '64px', boxShadow: 'var(--shadow-2xl)', background: '#000' }}>
        {carouselItems.map((item, idx) => (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', inset: 0, opacity: idx === carouselIndex ? 1 : 0, transition: 'opacity 1s ease-in-out', textDecoration: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)', zIndex: 1 }} />
            <img 
              src={item.img || item.image} 
              alt={item.title} 
              onError={handleImageError}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', bottom: '64px', left: '64px', right: '64px', zIndex: 2 }}>
              <span style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>HOT ISSUE</span>
              <h1 style={{ color: '#fff', fontSize: '2.25rem', marginBottom: '16px', textShadow: '0 4px 12px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>출처: {item.source} <ExternalLink size={16} /></p>
            </div>
          </a>
        ))}
        <button onClick={handlePrev} style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)' }}><ChevronLeft size={32} /></button>
        <button onClick={handleNext} style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)' }}><ChevronRight size={32} /></button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>{sortBy === 'latest' ? '최신' : '핫한'} <span className="gradient-text">IT 뉴스</span> 큐레이션</h2>
        <div style={{ display: 'flex', background: 'var(--color-surface-container-low)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }}>
           <button onClick={() => { setSortBy('latest'); setVisibleCount(8); window.scrollTo({top: 500, behavior: 'smooth'}); }} style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: sortBy === 'latest' ? 'var(--color-primary-container)' : 'transparent', color: sortBy === 'latest' ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)', fontWeight: sortBy === 'latest' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }}>최신뉴스</button>
           <button onClick={() => { setSortBy('hot'); setVisibleCount(8); window.scrollTo({top: 500, behavior: 'smooth'}); }} style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: sortBy === 'hot' ? 'var(--color-primary-container)' : 'transparent', color: sortBy === 'hot' ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)', fontWeight: sortBy === 'hot' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }}>핫한뉴스</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', alignItems: 'stretch' }}>
        {displayArticles.map((article) => {
          const isLiked = likedArticles.some(la => la.id === article.id && !la.hidden);
          const views = (article.baseViews || 0) + (articleViews[article.id] || 0);
          return (
            <a href={article.url} target="_blank" rel="noopener noreferrer" key={article.id} className="premium-card" style={{ display: 'flex', flexDirection: 'column' }} onClick={(e) => { if (e.target.closest('button')) { e.preventDefault(); return; } incrementView(article.id); }}>
              <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: 'var(--color-surface-container-low)' }}>
                <img 
                  src={article.img || stableImages[0]} 
                  alt={article.title} 
                  onError={handleImageError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="label gradient-text" style={{ textTransform: 'capitalize' }}>{article.source}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: views > 0 ? 'bold' : '500', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {views.toLocaleString()}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.95rem', marginBottom: '32px', flex: 1, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.summary}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.95rem' }}>뉴스 열람 <ExternalLink size={16} /></div>
                  <button onClick={(e) => { e.preventDefault(); toggleArticleLike(article); showToast(isLiked ? '좋아요를 취소했습니다.' : '기사를 좋아요 목록에 추가했습니다.'); }} style={{ background: isLiked ? 'var(--color-error-container)' : 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', color: isLiked ? 'var(--color-error)' : 'var(--color-on-surface-variant)' }}>
                    <Heart size={20} fill={isLiked ? 'var(--color-error)' : 'none'} />
                  </button>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div ref={observerRef} style={{ height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '48px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <svg width="40" height="40" viewBox="0 0 48 48" className="ios-loading-spinner">
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1="24" y1="4" x2="24" y2="14" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 30} 24 24)`} className={`ios-spinner-blade blade-${i}`} />
              ))}
            </svg>
            <span style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: '500', letterSpacing: '0.05em' }}>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
