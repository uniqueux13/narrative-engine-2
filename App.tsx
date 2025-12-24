import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import RecipeBuilder from './pages/RecipeBuilder';
import Layout from './components/Layout';
import { ProjectProvider } from './services/projectContext';

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="studio/:projectId" element={<Studio />} />
            <Route path="builder" element={<RecipeBuilder />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ProjectProvider>
  );
};

export default App;