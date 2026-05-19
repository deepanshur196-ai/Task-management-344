import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import NotificationsPanel from './NotificationsPanel';

const Topbar = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((item) => !item.seen).length;

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 shadow flex items-center justify-between px-8 fixed top-0 left-64 right-0 z-10">
        <div className="font-semibold text-lg truncate">Welcome, {user?.name}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className="relative p-2 rounded-full hover:bg-slate-100 transition"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>
      <NotificationsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
};

export default Topbar;
