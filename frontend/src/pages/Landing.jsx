import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl font-bold text-blue-800 mb-4">Ethara</h1>
        <p className="text-lg text-gray-700 mb-8">
          Collaborative task management for teams. Projects, tasks, real-time updates — all in one place.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 transition">
            Login
          </Link>
          <Link to="/signup" className="bg-white text-blue-700 px-6 py-3 rounded shadow hover:bg-gray-50 transition border border-blue-200">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
