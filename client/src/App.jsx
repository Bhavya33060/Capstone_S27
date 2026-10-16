import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StationExplorer from './pages/StationExplorer.jsx';
import RegionalComparison from './pages/RegionalComparison.jsx';
import GeospatialMap from './pages/GeospatialMap.jsx';
import DataQuality from './pages/DataQuality.jsx';
import Architecture from './pages/Architecture.jsx';
import About from './pages/About.jsx';
import Heatmap from './pages/Heatmap.jsx';
import Database from './pages/Database.jsx';

const titles = {
  '/': 'Live Dashboard',
  '/heatmap': 'Heatmaps',
  '/database': 'Database',
  '/stations': 'Station Explorer',
  '/regions': 'Regional Comparison',
  '/map': 'Geospatial Map',
  '/quality': 'Data Quality',
  '/architecture': 'System Architecture',
  '/about': 'Project Overview',
};

function DashboardLayout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className={`main-area ${collapsed ? 'collapsed' : ''}`}>
        <Navbar onMenuClick={() => setMobileOpen(true)} title={title} />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const title = titles[location.pathname] || 'CitiBike Analytics';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {Object.keys(titles).map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <DashboardLayout title={title}>
                {path === '/' && <Dashboard />}
                {path === '/stations' && <StationExplorer />}
                {path === '/regions' && <RegionalComparison />}
                {path === '/map' && <GeospatialMap />}
                {path === '/quality' && <DataQuality />}
                {path === '/architecture' && <Architecture />}
                {path === '/about' && <About />}
                {path === '/heatmap' && <Heatmap />}
                {path === '/database' && <Database />}
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      ))}
    </Routes>
  );
}
