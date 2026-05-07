import { Routes, Route, Navigate } from 'react-router-dom';
import { CompanionBuilder } from './pages/CompanionBuilder';
import { CompanionHub }     from './pages/CompanionHub';
import { CompanionAdmin }   from './pages/CompanionAdmin';

export function App() {
  return (
    <Routes>
      <Route path="/companion" element={<CompanionBuilder />} />
      <Route path="/hub"       element={<CompanionHub />}     />
      <Route path="/admin"     element={<CompanionAdmin />}   />
      <Route path="*"          element={<Navigate to="/companion" replace />} />
    </Routes>
  );
}

export default App;
