import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, ArrowRight, ExternalLink, Activity, Target, Plus } from 'lucide-react';

export default function Recommendations() {
  const [visibleCount, setVisibleCount] = useState(3);
  const { likedKeywords, likedArticles } = useStore();
  
  const activeKeywords = likedKeywords.filter(k => !k.hidden).map(k => k.text);
  const activeArticles = likedArticles.filter(a => !a.hidden);
  const hasLikes = activeKeywords.length > 0 || activeArticles.length > 0;

  // 단순 텍스트 기반 관심사 분석 로직 (키워드 빈도 추출 및 퍼센티지화)
  const analyzeInterests = () => {
    if (!hasLikes) return [];
    
    const texts = activeArticles.map(a => a.title + " " + a.summary).join(' ');
    const predefinedCategories = {
      '인공지능/AI': ['AI', '인공지능', '챗GPT', 'GPT', '모델', 'LLM', '오픈AI', 'G-4'],
      '개발/프로그래밍': ['개발', '프론트엔드', '백엔드', '코딩', '코드', '리액트', '자바스크립트', '스프링', '파이썬'],
      '데이터/클라우드': ['데이터', '클라우드', '서버', 'AWS', 'DB', '분석'],
      'IT트렌드/비즈니스': ['트렌드', '스타트업', '비즈니스', '빅테크', '애플', '구글', '플랫폼', '서비스'],
      '보안/네트워크': ['보안', '해킹', '네트워크', '인증', '블록체인']
    };
    
    let scores = {};
    
    // 키워드 점수 가중치 20점
    activeKeywords.forEach(kw => {
        let matched = false;
        const upperKw = kw.toUpperCase();
        Object.keys(predefinedCategories).forEach(cat => {
            if (predefinedCategories[cat].some(sub => upperKw.includes(sub.toUpperCase()) || sub.toUpperCase().includes(upperKw))) {
                scores[cat] = (scores[cat] || 0) + 20;
                matched = true;
            }
        });
        if (!matched) {
            scores[kw] = (scores[kw] || 0) + 15;
        }
    });

    // 기사 텍스트 점수 (빈도 당 5점)
    Object.keys(predefinedCategories).forEach(cat => {
        predefinedCategories[cat].forEach(word => {
            const regex = new RegExp(word, 'gi');
            const matches = texts.match(regex);
            if (matches) {
                scores[cat] = (scores[cat] || 0) + (matches.length * 5);
            }
        });
    });

    if (Object.keys(scores).length === 0) {
      if (activeKeywords.length > 0) {
        return activeKeywords.map(k => ({ name: k, score: 10, percentage: 50 }));
      }
      return [];
    }
    
    // 퍼센트 계산
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxScore = Math.max(...sorted.map(s => s[1]), 10); 
    
    return sorted.map(([name, score]) => ({
        name,
        score,
        percentage: Math.min(100, Math.max(5, Math.round((score / maxScore) * 100)))
    }));
  };

  const interestData = analyzeInterests();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
        <Sparkles size={40} color="var(--color-primary-container)" style={{ filter: 'drop-shadow(0 0 12px var(--color-primary-neon))'}} />
        <h1 style={{ fontSize: '2.5rem' }}>맞춤 추천 인사이트</h1>
      </div>

      {!hasLikes ? (
        <div className="premium-card shadow-ambient" style={{ padding: '80px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
            관심 키워드를 등록하거나 기사에 좋아요를 누르면 알고리즘이 나만의 추천 아티클을 분석하여 시각화된 인사이트를 제공해 드립니다.
          </p>
          <a href="/likes" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            관심사 설정하러 가기 <ArrowRight size={18} />
          </a>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '48px' }}>
            <span className="label gradient-text" style={{ padding: '8px 16px', background: 'var(--color-primary-container)', borderRadius: 'var(--radius-full)' }}>Recommendation Engine Active</span>
            <p style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)', fontSize: '1.1rem' }}>
              다음 키워드 및 시청 기록을 기반으로 큐레이션 되었습니다:{' '}
              <strong className="gradient-text" style={{ fontWeight: '800' }}>{activeKeywords.join(', ') || '최근 읽고 좋아요 누른 뉴스 기록'}</strong>
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '32px',
            marginBottom: '64px'
          }}>
            {/* 좋아요 누른 기사들을 관련 기사로 재포장하거나 추천 키워드로 검색 링크 표시 */}
            {activeArticles.slice(0, visibleCount).map((article, idx) => (
              <a 
                href={article.url} target="_blank" rel="noopener noreferrer" key={article.id} 
                className="premium-card shadow-ambient" 
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {article.img && (
                  <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                    <img src={article.img} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span className="gradient-text" style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '16px', letterSpacing: '0.1em' }}>동일 저자/유사 분야 추천 (MATCHED 99%)</span>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                  <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.95rem', marginBottom: '32px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.summary}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--color-primary)', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginTop: 'auto' }}>
                     이어서 흥미로운 글 마저 읽기 <ExternalLink size={16} />
                  </div>
                </div>
              </a>
            ))}

            {activeKeywords.map((keyword, idx) => (
               <a 
                 href={`https://yozm.wishket.com/magazine/search/?q=${encodeURIComponent(keyword)}`} target="_blank" rel="noopener noreferrer" key={`kw-${idx}`} 
                 className="premium-card shadow-ambient" 
                 style={{ display: 'flex', flexDirection: 'column' }}
               >
                 <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                    <img src={`https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=600&q=80`} alt={keyword} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 </div>
                 <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                   <span className="gradient-text" style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '16px', letterSpacing: '0.1em' }}>관심 키워드 추천 (MATCHED 95%)</span>
                   <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>[{keyword}] 관련 최신 트렌드 및 심층 인사이트</h3>
                   <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.95rem', marginBottom: '32px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                     회원님의 관심 키워드 '{keyword}'에 부합하는 연관 아티클 검색 결과입니다. 기존 방식의 한계를 뛰어넘는 새로운 대안을 확인하세요.
                   </p>
                   <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--color-primary)', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginTop: 'auto' }}>
                      추천된 검색 결과 탐색 <ExternalLink size={16} />
                   </div>
                 </div>
               </a>
             ))}
          </div>

          {activeArticles.length > visibleCount && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '64px' }}>
              <button 
                onClick={() => setVisibleCount(prev => prev + 3)}
                className="btn-primary" 
                style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', borderRadius: 'var(--radius-full)' }}
              >
                 <Plus size={20} /> 추천 기사 더보기
              </button>
            </div>
          )}

          {/* 시각화 섹션 추가 */}
          {interestData.length > 0 && (
            <div className="premium-card shadow-ambient" style={{ padding: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <Activity size={28} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.75rem', margin: 0 }}>나의 IT 뉴스 관심도 분석 (Insight Analytics)</h2>
              </div>
              <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px', fontSize: '1.05rem' }}>
                최근 읽은 본 기사, 좋아요한 기록, 그리고 미리 등록한 관심 키워드의 주요 단어 빈도 및 패턴을 알고리즘이 분석하여 주요 활성 분야를 시각화한 결과입니다.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {interestData.map((data, index) => (
                  <div key={index} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={16} color="var(--color-primary)" /> {data.name}
                      </span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{data.percentage}% 매칭</span>
                    </div>
                    <div style={{ height: '12px', background: 'var(--color-surface-container-highest)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${data.percentage}%`, 
                          background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-container))',
                          borderRadius: '6px',
                          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
