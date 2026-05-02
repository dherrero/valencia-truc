import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import GamePage from './pages/GamePage';
import RulesPage from './pages/RulesPage';
import { OrientationGuard } from './components/OrientationGuard';

export function App() {
  return (
    <div className="w-full h-full min-h-screen bg-slate-900">
      <OrientationGuard />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reglas" element={<RulesPage />} />
        <Route path="/partida/:uid" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
