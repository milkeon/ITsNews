import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Likes from './pages/Likes';
import Recommendations from './pages/Recommendations';

function App() {
  const purgeBadData = useStore(state => state.purgeBadData);
  const fetchNotionData = useStore(state => state.fetchNotionData);

  useEffect(() => {
    purgeBadData();
    fetchNotionData();
  }, [purgeBadData, fetchNotionData]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="likes" element={<Likes />} />
          <Route path="recommendations" element={<Recommendations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
