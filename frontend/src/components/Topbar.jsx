import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-8 fixed top-0 left-64 right-0 z-10">
      <div className="font-semibold text-lg truncate">Welcome, {user?.name}</div>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
      >
        Logout
      </button>
    </header>
  );
};

export default Topbar;
