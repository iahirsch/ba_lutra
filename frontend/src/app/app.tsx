import { Routes, Route, Navigate } from 'react-router-dom';
import { CompanionBuilder } from './pages/CompanionBuilder';
import { CompanionHub } from './pages/CompanionHub';
import { CompanionAdmin } from './pages/CompanionAdmin';
import { InteractionStage } from './pages/InteractionStage';

export function App() {
  return (
    <Routes>
      <Route path="/companion" element={<CompanionBuilder />} />
      <Route path="/hub" element={<CompanionHub />} />
      <Route path="/admin" element={<CompanionAdmin />} />
      <Route path="/interaction" element={<InteractionStage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
