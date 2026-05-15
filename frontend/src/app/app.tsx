import { Routes, Route, Navigate } from 'react-router-dom';
import { Editor } from './pages/Editor';
import { Hub } from './pages/Hub';
import { AdminDashboard } from './pages/AdminDashboard';
import { Interaction } from './pages/Interaction';

export function App() {
  return (
    <Routes>
      <Route path="/editor" element={<Editor />} />
      <Route path="/companion" element={<Navigate to="/editor" replace />} />
      <Route path="/hub" element={<Hub />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/interaction" element={<Interaction />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
