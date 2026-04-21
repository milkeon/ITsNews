import { Outlet } from 'react-router-dom';
import Header from './Header';
import Toast from './Toast';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
