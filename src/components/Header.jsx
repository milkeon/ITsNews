import { Link } from 'react-router-dom';
import { Newspaper, Heart, Sparkles, Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useStore();
  
  return (
    <header className="glass-header" style={{ padding: '0 24px', borderBottom: '1px solid var(--color-outline-variant)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '72px', maxWidth: '1600px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
            <Newspaper size={24} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>
            IT'sNew
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <Link to="/likes" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Heart size={18} /> 좋아요 목록
          </Link>
          <Link to="/recommendations" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Sparkles size={18} /> 추천 기사
          </Link>
          <button 
            onClick={toggleDarkMode}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface)',
              display: 'flex', alignItems: 'center', marginLeft: '12px'
            }}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
