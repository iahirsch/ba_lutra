import { Routes, Route, Navigate } from 'react-router-dom';
import { CompanionBuilder } from './companion/CompanionBuilder';

export function App() {
  return (
    <Routes>
      <Route path="/companion" element={<CompanionBuilder />} />
      <Route path="*" element={<Navigate to="/companion" replace />} />
    </Routes>
  );
}

export default App;
