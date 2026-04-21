import { useStore } from '../store/useStore';

export default function Toast() {
  const toastMessage = useStore((state) => state.toastMessage);

  if (!toastMessage) return null;

  return (
    <div 
      className="toast-enter shadow-ambient"
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--color-on-surface)',
        color: 'var(--color-surface)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-full)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(26, 28, 30, 0.15)'
      }}
    >
      {toastMessage}
    </div>
  );
}
