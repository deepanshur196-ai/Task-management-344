import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const isProjectLead = user?.designation === 'Project Lead';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/projects', label: 'Projects' },
    ...(isProjectLead ? [{ to: '/team', label: 'My Team' }] : []),
    { to: '/tasks', label: 'Tasks' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <aside className="bg-white shadow h-full w-64 p-6 flex flex-col gap-4 fixed top-0 left-0 z-20">
      <h1 className="text-2xl font-bold mb-8 text-blue-700">Ethara</h1>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded p-2 transition ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-blue-50'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
