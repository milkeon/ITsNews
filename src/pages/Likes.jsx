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
    downloadAnchorNode.setAttribute("download", "itsnew_liked_articles.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('좋아요 목록이 로컬 파일로 저장되었습니다.');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {visibleArticles.length === 0 && <p style={{ color: 'var(--color-on-surface-variant)' }}>아직 좋아요 한 기사가 없습니다.</p>}
          {visibleArticles.map(article => (
            <div 
              key={article.id} 
              className="premium-card shadow-ambient" 
              style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid transparent' }}
              onClick={() => window.open(article.url, '_blank')}
            >
              <div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>{article.title}</h3>
                <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>출처: {article.source}</p>
              </div>
              <button 
                title="좋아요 취소"
                onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article); }}
                style={{ background: 'var(--color-error-container)', color: 'var(--color-error)', border: '1px solid transparent', padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
