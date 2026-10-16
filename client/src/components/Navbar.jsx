import { useState } from 'react';
import { Menu, Sun, Moon, LogOut, Download, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onMenuClick, title }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '??';

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="icon-btn mobile-only" onClick={onMenuClick}><Menu size={20} /></button>
        <h2>{title}</h2>
      </div>
      <div className="topnav-right">
        <button className="icon-btn ripple" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="btn btn-outline ripple export-btn"><Download size={15} /> Export</button>

        <div className="user-menu-wrap">
          <button className="user-chip" onClick={() => setMenuOpen((o) => !o)}>
            <span className="avatar">{initials}</span>
            <span className="user-name">{user?.name}</span>
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="user-dropdown scale-in">
              <div className="dropdown-email">{user?.email}</div>
              <button onClick={logout}><LogOut size={14} /> Log out</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .topnav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px,3vw,32px); background: var(--bg-main); border-bottom: 1px solid var(--border); backdrop-filter: blur(8px); }
        .topnav-left { display: flex; align-items: center; gap: 12px; }
        .topnav-left h2 { font-size: 18px; font-weight: 700; }
        .topnav-right { display: flex; align-items: center; gap: 10px; }
        .icon-btn { background: var(--card-secondary); border: 1px solid var(--border); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-main); transition: background 0.2s, transform 0.15s; }
        .icon-btn:hover { background: var(--secondary); color: #fff; transform: translateY(-1px); }
        .mobile-only { display: none; }
        .export-btn { padding: 9px 16px; font-size: 13.5px; }
        .user-menu-wrap { position: relative; }
        .user-chip { display: flex; align-items: center; gap: 8px; background: var(--card-secondary); border: 1px solid var(--border); border-radius: 999px; padding: 6px 12px 6px 6px; cursor: pointer; color: var(--text-main); }
        .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .user-name { font-size: 13.5px; font-weight: 600; }
        .user-dropdown { position: absolute; right: 0; top: 46px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-hover); min-width: 190px; padding: 10px; z-index: 60; }
        .dropdown-email { font-size: 12px; color: var(--text-secondary); padding: 4px 10px 10px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
        .user-dropdown button { display: flex; align-items: center; gap: 8px; width: 100%; background: none; border: none; padding: 8px 10px; border-radius: 8px; font-size: 13.5px; cursor: pointer; color: var(--error); }
        .user-dropdown button:hover { background: rgba(200,85,61,0.08); }
        @media (max-width: 900px) { .mobile-only { display: flex; } }
        @media (max-width: 560px) { .export-btn, .user-name { display: none; } }
      `}</style>
    </header>
  );
}
