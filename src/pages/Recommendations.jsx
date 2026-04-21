import { useStore } from '../store/useStore';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

export default function Recommendations() {
  const { likedKeywords, likedArticles } = useStore();
  
  const activeKeywords = likedKeywords.filter(k => !k.hidden).map(k => k.text);
  const hasLikes = activeKeywords.length > 0 || likedArticles.filter(a => !a.hidden).length > 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
        <Sparkles size={40} color="var(--color-primary-container)" style={{ filter: 'drop-shadow(0 0 12px var(--color-primary-neon))'}} />
        <h1 style={{ fontSize: '2.5rem' }}>맞춤 추천 인사이트</h1>
      </div>

      {!hasLikes ? (
        <div className="premium-card shadow-ambient" style={{ padding: '80px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
            관심 키워드를 등록하거나 기사에 좋아요를 누르면 알고리즘이 나만의 추천 아티클을 분석하여 큐레이션 해드립니다.
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
              다음 키워드들을 기반으로 큐레이션 되었습니다:{' '}
              <strong className="gradient-text" style={{ fontWeight: '800' }}>{activeKeywords.join(', ') || '최근 읽은 뉴스 기반'}</strong>
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '32px'
          }}>
            {Array.from({length: 6}).map((_, idx) => {
              const article = likedArticles.filter(a => !a.hidden)[idx];
              const keyword = activeKeywords[idx % activeKeywords.length] || 'IT/개발';
              
              if (article) {
                return (
                  <a 
                    href={article.url} target="_blank" rel="noopener noreferrer" key={article.id} 
                    className="premium-card shadow-ambient" 
                    style={{ padding: '32px', borderTop: '4px solid var(--color-primary-container)', display: 'flex', flexDirection: 'column' }}
                  >
                    <span className="gradient-text" style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '16px', letterSpacing: '0.1em' }}>MATCHED {99 - idx}%</span>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', lineHeight: '1.4' }}>{article.title}</h3>
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '1rem', marginBottom: '32px', flex: 1 }}>{article.summary}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--color-primary)', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                       본문 읽기 <ExternalLink size={16} />
                    </div>
                  </a>
                );
              }
              
              return (
                <a 
                  href={`https://yozm.wishket.com/magazine/search/?q=${encodeURIComponent(keyword)}`} target="_blank" rel="noopener noreferrer" key={`mock-${idx}`} 
                  className="premium-card shadow-ambient" 
                  style={{ padding: '32px', borderTop: '4px solid var(--color-primary-container)', display: 'flex', flexDirection: 'column' }}
                >
                  <span className="gradient-text" style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '16px', letterSpacing: '0.1em' }}>MATCHED {99 - idx}%</span>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', lineHeight: '1.4' }}>[{keyword}] 관련 최신 트렌드 및 심층 인사이트</h3>
                  <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '1rem', marginBottom: '32px', flex: 1 }}>
                    회원님의 관심 키워드 '{keyword}'에 부합하는 연관 아티클 모음입니다. 기존 방식의 한계를 뛰어넘는 새로운 대안을 확인하세요.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--color-primary)', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                     본문 살펴보기 <ExternalLink size={16} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
