import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, Download } from 'lucide-react';

export default function Likes() {
  const { likedKeywords, addKeyword, removeKeyword, likedArticles, toggleArticleLike, showToast } = useStore();
  const [inputValue, setInputValue] = useState('');

  const visibleKeywords = likedKeywords.filter(k => !k.hidden);
  const visibleArticles = likedArticles.filter(a => !a.hidden);

  const handleSave = () => {
    if (!inputValue.trim()) return;
    addKeyword(inputValue.trim());
    showToast(`'${inputValue}' 키워드가 추가되었습니다.`);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleDeleteKeyword = (id, text) => {
    if (window.confirm(`'${text}' 키워드를 정말 삭제하시겠습니까?`)) {
      removeKeyword(id);
      showToast('키워드가 삭제 상태로 변경되었습니다.');
    }
  };

  const handleDeleteArticle = (article) => {
    if (window.confirm(`'${article.title}' 기사 좋아요를 취소하시겠습니까?`)) {
      toggleArticleLike(article);
      showToast('기사가 좋아요 목록에서 제거되었습니다.');
    }
  };

  const handleDownload = () => {
    if (visibleArticles.length === 0) {
      showToast('다운로드할 좋아요 기사가 없습니다.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(visibleArticles, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "itsnews_liked_articles.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('좋아요 목록이 로컬 파일로 저장되었습니다.');
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '40px' }}>나의 관심사 아카이브</h1>

      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--color-primary)' }}>관심 키워드 등록</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus 
            placeholder="새로운 관심 키워드를 입력하고 엔터를 누르세요..."
            className="input-premium"
            style={{ flex: 1, fontSize: '1rem' }}
          />
          <button onClick={handleSave} className="btn-primary">저장</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {visibleKeywords.length === 0 && <span style={{ color: 'var(--color-on-surface-variant)' }}>등록된 키워드가 없습니다.</span>}
          {visibleKeywords.map(kw => (
            <div 
              key={kw.id} 
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)',
                borderRadius: 'var(--radius-full)', fontWeight: '500'
              }}
            >
              # {kw.text}
              <button 
                onClick={() => handleDeleteKeyword(kw.id, kw.text)} 
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', margin: 0 }}>좋아요한 뉴스 ({visibleArticles.length})</h2>
          <button 
            onClick={handleDownload}
            className="btn-primary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', borderRadius: '8px' }}
          >
            <Download size={16} /> PC에 저장 (JSON)
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', alignItems: 'stretch' }}>
          {visibleArticles.length === 0 && <p style={{ color: 'var(--color-on-surface-variant)', gridColumn: '1 / -1' }}>아직 좋아요 한 기사가 없습니다.</p>}
          {visibleArticles.map(article => (
            <div 
              key={article.id} 
              className="premium-card shadow-ambient" 
              style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
              onClick={(e) => {
                 if (e.target.closest('button')) return;
                 window.open(article.url, '_blank');
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
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.95rem', marginBottom: '32px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {article.summary}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto' }}>
                  <button 
                    title="좋아요 취소"
                    onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article); }}
                    style={{ background: 'var(--color-error-container)', color: 'var(--color-error)', border: '1px solid transparent', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
