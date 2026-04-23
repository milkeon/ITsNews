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
  'okky.kr': 'OKKY'
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
  const visibleSources = newsSources.filter(s => !s.hidden);

  const formatDisplayName = (name) => {
    if (!name) return '';
    let cleaned = name.trim();
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

    if (cachedMasterList && cachedMasterList.length > 0) {
      setMasterList(cachedMasterList);
      return;
    }

    const loadData = async () => {
      setLoading(true);

      const sourcePools = await Promise.all(visibleSources.map(async (source) => {
        const cleanName = formatDisplayName(source.name);
        const sourceUrl = source.url || source.name;
        try {
          let targetUrl = sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`;
          let resultHtml = "";
          let fetchTarget = targetUrl;

          if (cleanName === '요즘IT') {
             const res = await fetch('/proxy/yozm/magazine/');
             resultHtml = await res.text();
             fetchTarget = 'https://yozm.wishket.com';
          } else if (cleanName === 'GeekNews') {
             const res = await fetch('/proxy/geek/');
             resultHtml = await res.text();
             fetchTarget = 'https://news.hada.io';
          } else if (cleanName === 'ITWORLD') {
             const res = await fetch('/proxy/itworld/');
             resultHtml = await res.text();
             fetchTarget = 'https://www.itworld.co.kr';
          } else {
             const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
             const res = await fetch(proxyUrl);
             resultHtml = await res.text();
          }
          
          const doc = new DOMParser().parseFromString(resultHtml, 'text/html');
          let articles = [];
          
          const links = Array.from(doc.querySelectorAll('a'));
          const articleLinks = links.filter(a => {
            const href = a.getAttribute('href') || '';
            const t = (a.textContent || a.innerText || '').trim();
            if (cleanName === '요즘IT' && !href.includes('/magazine/detail/')) return false;
            if (cleanName === 'GeekNews' && (!a.parentElement || !a.parentElement.className.includes('topictitle'))) return false;
            if (href.includes('/collection/') || href.includes('/author/') || href.includes('tag=') || href.includes('@') || href.includes('comment')) return false;
            if (t.match(/^(댓글|조회|추천|작성자|by |from )/i)) return false;
            if (t.length < 15) return false;
            if (/(로그인|회원가입|이용약관|취급방침|개인정보|고객센터|공지사항|회사소개|뉴스레터|페이스북|유튜브|인스타그램|네이버|카카오|트위터|홈으로|스크랩)/.test(t)) return false;
            return true;
          });
          
          const seenUrls = new Set();
          
          for (let a of articleLinks) {
            if (articles.length >= 20) break;
            
            let link = a.getAttribute('href');
            if (!link || link.startsWith('javascript:')) continue;
            
            let fullUrl = link.startsWith('http') ? link : (new URL(link, fetchTarget).href);
            if (seenUrls.has(fullUrl)) continue;
            seenUrls.add(fullUrl);
            
            let titleEl = a.querySelector('h1, h2, h3, h4, h5, strong, p[class*="title"], div[class*="title"], span[class*="title"]');
            let title = titleEl ? (titleEl.textContent || titleEl.innerText || '').trim() : (a.textContent || a.innerText || '').trim();
            if (title.includes('\n')) title = title.split('\n')[0].trim();
            let views = 0;
            const parent = a.parentElement?.parentElement || a.parentElement;
            
            if (parent) {
              const text = parent.textContent || parent.innerText || '';
              const kN = text.match(/([0-9]+(?:\.[0-9]+)?)[Kk]/);
              if (kN) {
                views = Math.floor(parseFloat(kN[1]) * 1000);
              } else {
                const rawCount = text.match(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,})\s*(?:points|views|조회|조회수)/i);
                if (rawCount) views = parseInt(rawCount[1].replace(/,/g, ''));
              }
            }
            
            let imgUrl = stableImages[(articles.length + cleanName.length) % stableImages.length];
            if (parent) {
                const img = parent.querySelector('img');
                if (img) {
                    let src = img.getAttribute('src') || img.getAttribute('data-src');
                    if (src) {
                        if (src.startsWith('//')) src = 'https:' + src;
                        else if (src.startsWith('/')) {
                            if (cleanName === '요즘IT') src = 'https://yozm.wishket.com' + src;
                            else if (cleanName === 'GeekNews') src = 'https://news.hada.io' + src;
                            else if (cleanName === 'ITWORLD') src = 'https://www.itworld.co.kr' + src;
                        }
                        if (src.startsWith('http')) imgUrl = src;
                    }
                }
            }

            let summary = `${cleanName} 서버에서 수집된 실시간 전문입니다.`;
            if (cleanName === 'GeekNews') {
                const row = a.closest('.topic_row') || (parent && parent.closest('.topic_row'));
                if (row) {
                    const desc = row.querySelector('.topicdesc');
                    if (desc) summary = (desc.textContent || desc.innerText || '').trim();
                }
            } else {
                const descEl = a.querySelector('.description, .item-description, p[class*="desc"], div[class*="desc"]') || (parent && parent.querySelector('.description'));
                if (descEl && (descEl.textContent || descEl.innerText || '').trim().length > 5) {
                    summary = (descEl.textContent || descEl.innerText || '').trim();
                }
            }

            articles.push({
              id: fullUrl,
              title: title,
              source: cleanName,
              summary: summary,
              url: fullUrl,
              img: imgUrl,
              baseViews: views
            });
          }

          const fetchPromises = [];
          for (const art of articles) {
            if (fetchPromises.length >= 4) break;
            if (art.summary === `${cleanName} 서버에서 수집된 실시간 전문입니다.`) {
              fetchPromises.push((async () => {
                try {
                  const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(art.url)}`, { cache: 'no-cache' });
                  if (!res.ok) return;
                  const html = await res.text();
                  
                  // 프록시 타임아웃 캐시 방어
                  if (html.trim().length < 500 || html.includes('Request Timeout')) return;

                  const dDoc = new DOMParser().parseFromString(html, 'text/html');
                  const metaDesc = dDoc.querySelector('meta[property="og:description"], meta[name="description"]');
                  let extracted = '';
                  if (metaDesc && (metaDesc.content || '').trim().length > 10) {
                      extracted = (metaDesc.content || '').trim();
                  } else {
                      const ps = Array.from(dDoc.querySelectorAll('p, div[class*="content"], div[class*="body"]'));
                      const validP = ps.find(p => {
                          const txt = (p.textContent||'').replace(/\\s+/g, ' ').trim();
                          return txt.length > 50 && !txt.includes('로그인') && !txt.includes('Copyright');
                      });
                      if (validP) extracted = (validP.textContent || '').replace(/\\s+/g, ' ').trim();
                  }
                  
                  if (extracted && extracted.length > 15) {
                      art.summary = extracted.substring(0, 150) + (extracted.length > 150 ? '...' : '');
                  }
                } catch(e) {}
              })());
            }
          }
          await Promise.all(fetchPromises);

          if (articles.length > 0) return articles;
        } catch(e) {
          console.error("Crawl error for", cleanName, e);
        }

        return Array.from({length: 10}).map((_, i) => ({
          id: `${sourceUrl}-mock-${i+1}`,
          title: `[${cleanName}] 통신 지연: 무작위 기사 대체 중`,
          source: cleanName,
          summary: `대상 사이트로부터 파싱하지 못하여 회색(0) 처리됨`,
          url: sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`, 
          img: stableImages[(i + cleanName.length) % stableImages.length],
          baseViews: 0
        }));
      }));

      let combined = [];
      const maxLength = Math.max(...sourcePools.map(pool => pool.length));
      for (let i = 0; i < maxLength; i++) {
        for (let pool of sourcePools) {
          if (pool[i]) combined.push(pool[i]);
        }
      }

      setMasterList(combined);
      setCachedMasterList(combined);
      setLoading(false);
      setVisibleCount(8);
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsSources]); 

  const displayList = [...masterList];
  if (sortBy === 'hot') {
    displayList.sort((a, b) => {
      const valB = (b.baseViews || 0) + (articleViews[b.id] || 0);
      const valA = (a.baseViews || 0) + (articleViews[a.id] || 0);
      return valB - valA;
    });
  }
  const displayArticles = displayList.slice(0, visibleCount);

  // Compute dynamic top 3 hottest articles
  const hotList = [...masterList].sort((a, b) => {
    const valB = (b.baseViews || 0) + (articleViews[b.id] || 0);
    const valA = (a.baseViews || 0) + (articleViews[a.id] || 0);
    return valB - valA;
  });
  const carouselItems = hotList.length >= 3 ? hotList.slice(0, 3) : mockHottest;

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !loading && visibleCount < masterList.length) {
      setLoading(true);
      setTimeout(() => {
        setVisibleCount(prev => prev + 4);
        setLoading(false);
      }, 1000); 
    }
  }, [loading, visibleCount, masterList.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1.0 });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const carouselLen = carouselItems.length;

  const resetCarouselTimer = useCallback(() => {
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselLen);
    }, 5000);
  }, [carouselLen]);

  useEffect(() => {
    resetCarouselTimer();
    return () => clearInterval(timerRef.current);
  }, [resetCarouselTimer]);

  const handlePrev = (e) => {
    e.preventDefault();
    setCarouselIndex(prev => (prev - 1 + carouselLen) % carouselLen);
    resetCarouselTimer();
  };

  const handleNext = (e) => {
    e.preventDefault();
    setCarouselIndex(prev => (prev + 1) % carouselLen);
    resetCarouselTimer();
  };

  const handleAddSource = async () => {
    if(!sourceInput.trim()) return;
    let target = sourceInput.trim();
    if (!target.startsWith('http') && !target.startsWith('https')) {
       target = 'https://' + target;
    }
    
    let finalName = formatDisplayName(sourceInput.trim());
    showToast(`'${finalName}' 출처 정보를 불러오는 중...`);
    
    try {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`;
        const res = await fetch(proxyUrl);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
        if (ogSiteName && ogSiteName.content) {
            finalName = ogSiteName.content.trim();
        } else {
            const titleEl = doc.querySelector('title');
            if (titleEl) {
                const titleText = titleEl.innerText;
                const parts = titleText.split(/[-|]/);
                finalName = (parts[parts.length - 1].trim() || parts[0].trim());
            }
        }
    } catch (e) {
        console.warn("Title fetch failed");
    }
    
    addSource(finalName, target);
    showToast(`'${finalName}' 출처가 추가되었습니다.`);
    setSourceInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSource();
    }
  };

  const handleDeleteSource = (source) => {
    if (window.confirm(`'${formatDisplayName(source.name)}' 출처를 삭제하시겠습니까?`)) {
      removeSource(source.id);
      showToast('해당 출처가 삭제 목록으로 이동되었습니다.');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 사이드바 열기 버튼 (접혀있을 때) */}
      {!isSidebarOpen && (
        <button 
          className="premium-card shadow-ambient"
          onClick={() => setIsSidebarOpen(true)}
          style={{ 
            position: 'fixed', right: '32px', top: '120px', zIndex: 40,
            padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', 
            cursor: 'pointer', border: '1px solid var(--color-outline)', background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)', color: 'var(--color-primary)'
          }}
        >
          <Settings size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>출처 관리</span>
        </button>
      )}

      {/* 사이드바 패널 (펼쳐졌을 때) */}
      <div 
        className="premium-card shadow-ambient" 
        style={{ 
          position: 'fixed', right: '32px', top: '120px', width: '320px', zIndex: 40,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(120%)',
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column',
          textAlign: 'left' // 글자 왼쪽 정렬
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              크롤링 출처 관리
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', marginTop: '8px', marginBottom: 0, lineHeight: '1.4' }}>
              새로운 뉴스 소스를 등록하세요.<br/>(도메인 입력 시 자동변환)
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input 
              type="text" 
              value={sourceInput}
              onChange={e => setSourceInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="새 사이트 (ex. 외부블로그)"
              className="input-premium"
              style={{ flex: 1, fontSize: '0.9rem', textAlign: 'left' }}
            />
            <button 
              onClick={handleAddSource} 
              className="btn-primary" 
              style={{ padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {visibleSources.length === 0 && <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.85rem', textAlign: 'left' }}>활성화된 출처가 없습니다.</span>}
            {visibleSources.map(s => (
              <div key={s.id} className="surface-low" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'baseline', gap: '8px', textAlign: 'left' }}>
                  {formatDisplayName(s.name)}
                  <span style={{ fontSize: '0.65rem', fontWeight: '400', color: 'var(--color-primary)' }}>Active</span>
                </div>
                <button 
                  onClick={() => handleDeleteSource(s)} 
                  style={{ background: 'var(--color-error-container)', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="premium-card shadow-ambient" style={{ height: '500px', marginBottom: '64px', position: 'relative' }}>
        {carouselItems.map((item, idx) => (
          <a
            href={item.url} target="_blank" rel="noopener noreferrer" key={item.id} 
            style={{ 
              position: 'absolute', width: '100%', height: '100%', 
              opacity: idx === carouselIndex ? 1 : 0, 
              pointerEvents: idx === carouselIndex ? 'auto' : 'none',
              backgroundImage: `url(${item.image || item.img})`, backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          >
            <div style={{
              width: '100%', height: '100%', 
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '64px',
              paddingLeft: '110px', paddingRight: '110px'
            }}>
              <span className="label gradient-text" style={{ marginBottom: '12px', fontSize: '1rem' }}>🔥 HOT ISSUE</span>
              <h1 style={{ color: '#fff', fontSize: '3.5rem', marginBottom: '16px', textShadow: '0 4px 12px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                출처: {item.source} <ExternalLink size={16} />
              </p>
            </div>
          </a>
        ))}

        <button 
          onClick={handlePrev}
          style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
        >
          <ChevronLeft size={32} />
        </button>

        <button 
          onClick={handleNext}
          style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
        >
          <ChevronRight size={32} />
        </button>
        
        <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {carouselItems.map((_, idx) => (
            <div 
              key={idx} 
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === carouselIndex ? 'var(--color-primary)' : 'rgba(255,255,255,0.4)', transition: 'background 0.3s' }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>{sortBy === 'latest' ? '최신' : '핫한'} <span className="gradient-text">IT 뉴스</span> 큐레이션</h2>
        <div style={{ display: 'flex', background: 'var(--color-surface-container-low)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }}>
           <button 
             onClick={() => { setSortBy('latest'); setVisibleCount(8); window.scrollTo({top: 500, behavior: 'smooth'}); }}
             style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: sortBy === 'latest' ? 'var(--color-primary-container)' : 'transparent', color: sortBy === 'latest' ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)', fontWeight: sortBy === 'latest' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }}
           >
             최신뉴스
           </button>
           <button 
             onClick={() => { setSortBy('hot'); setVisibleCount(8); window.scrollTo({top: 500, behavior: 'smooth'}); }}
             style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: sortBy === 'hot' ? 'var(--color-primary-container)' : 'transparent', color: sortBy === 'hot' ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)', fontWeight: sortBy === 'hot' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }}
           >
             핫한뉴스
           </button>
        </div>
      </div>

      {masterList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-on-surface-variant)' }}>
          등록된 크롤링 소스가 없습니다. 우측 메뉴에서 추가해주세요.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', alignItems: 'stretch' }}>
        {displayArticles.map((article) => {
          const isLiked = likedArticles.some(la => la.id === article.id && !la.hidden);
          const views = (article.baseViews || 0) + (articleViews[article.id] || 0);
          const viewColor = views > 0 ? 'var(--color-primary)' : 'var(--color-on-surface-variant)';

          return (
            <a 
              href={article.url} target="_blank" rel="noopener noreferrer" key={article.id} 
              className="premium-card" 
              style={{ display: 'flex', flexDirection: 'column' }}
              onClick={(e) => {
                 if (e.target.closest('button')) {
                    e.preventDefault();
                    return;
                 }
                 incrementView(article.id);
              }}
            >
              {article.img && (
                <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                  <img src={article.img} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="label gradient-text" style={{ textTransform: 'capitalize' }}>{article.source}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: views > 0 ? 'bold' : '500', color: viewColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={14} /> {views.toLocaleString()}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.95rem', marginBottom: '32px', flex: 1, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {article.summary}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.95rem' }}>
                    뉴스 열람 <ExternalLink size={16} />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleArticleLike(article);
                      showToast(isLiked ? '좋아요를 취소했습니다.' : '기사를 좋아요 목록에 추가했습니다.');
                    }}
                    style={{ 
                      background: isLiked ? 'var(--color-error-container)' : 'var(--color-surface-container-lowest)', 
                      border: '1px solid var(--color-outline)', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '40px', height: '40px', borderRadius: '50%',
                      color: isLiked ? 'var(--color-error)' : 'var(--color-on-surface-variant)'
                    }}
                  >
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
                <line
                  key={i}
                  x1="24" y1="4" x2="24" y2="14"
                  stroke="var(--color-primary)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  transform={`rotate(${i * 30} 24 24)`}
                  className={`ios-spinner-blade blade-${i}`}
                />
              ))}
            </svg>
            <span style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: '500', letterSpacing: '0.05em' }}>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
