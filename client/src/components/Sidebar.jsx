import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, Globe2, Clock, GitCompare, ShieldCheck,
  Network, Info, ChevronLeft, Bike, Flame, Database,
} from 'lucide-react';

const navItems = [
  { to: '/about', label: 'Project Overview', icon: Info },
  { to: '/architecture', label: 'System Architecture', icon: Network },
  { to: '/quality', label: 'Data Quality', icon: ShieldCheck },
  { to: '/database', label: 'Database', icon: Database },
  { to: '/', label: 'Live Dashboard', icon: LayoutDashboard, end: true },
  { to: '/heatmap', label: 'Heatmaps', icon: Flame },
  { to: '/map', label: 'Geospatial Map', icon: Globe2 },
  { to: '/stations', label: 'Station Explorer', icon: MapPin },
  { to: '/regions', label: 'Regional Comparison', icon: GitCompare },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Bike size={26} color="#D08C60" />
          {!collapsed && <span>CitiBike Analytics</span>}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}>
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="collapse-btn" onClick={() => setCollapsed((c) => !c)}>
          <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      <style>{`
        .sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-w); background: var(--navbar); display: flex; flex-direction: column; transition: width 0.3s ease, transform 0.3s ease; z-index: 100; padding: 18px 12px; }
        .sidebar.collapsed { width: var(--sidebar-w-collapsed); }
        .sidebar-brand { display: flex; align-items: center; gap: 10px; color: #fff; font-family: var(--font-heading); font-weight: 700; font-size: 17px; padding: 8px 10px 22px 10px; }
        .sidebar-nav { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; color: rgba(255,255,255,0.75); text-decoration: none; font-size: 14px; font-weight: 500; transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease; white-space: nowrap; }
        .sidebar-link:hover { background: rgba(255,255,255,0.08); color: #fff; transform: translateX(2px); }
        .sidebar-link.active { background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(88,129,87,0.4); }
        .collapse-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); border: none; color: #fff; padding: 10px; border-radius: 10px; cursor: pointer; font-size: 13px; margin-top: 8px; }
        .collapse-btn:hover { background: rgba(255,255,255,0.14); }
        .sidebar-scrim { display: none; }
        @media (max-width: 900px) {
          .sidebar { transform: translateX(-100%); width: 260px; }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-scrim { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 90; }
        }
      `}</style>
    </>
  );
}
