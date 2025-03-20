import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages - Direct imports
import Dashboard from './pages/Dashboard';
import CostAnalysis from './pages/CostAnalysis';
import Recommendations from './pages/Recommendations';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import BudgetManagement from './pages/BudgetManagement';
import TestPage from './pages/TestPage';

function App() {
  console.log('BudgetManagement component:', BudgetManagement); // Debug log
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="cost-analysis" element={<CostAnalysis />} />
          <Route path="budget-management" element={<BudgetManagement />} />
          <Route path="test" element={<TestPage />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="resources" element={<Resources />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App; 