import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const statusBadges = {
  Todo: 'badge-warning',
  'In Progress': 'badge-primary',
  Completed: 'badge-success',
};

const AdminDashboard = ({ data }) => {
  const maxCompleted = Math.max(1, ...data.teamPerformance.map((m) => m.completed || 0));
  const completionRate = data.totalTasks
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Projects" value={data.totalProjects} tone="blue" />
        <StatCard label="Total tasks" value={data.totalTasks} tone="gray" sublabel={`${completionRate}% completed`} />
        <StatCard label="Completed" value={data.completedTasks} tone="green" />
        <StatCard label="Pending" value={data.pendingTasks} tone="amber" />
        <StatCard label="Overdue" value={data.overdueTasks} tone="red" />
      </div>

      <div className="card-elevated p-8 animate-slide-up">
        <h3 className="text-2xl font-bold gradient-text mb-6">Team Performance</h3>
        {data.teamPerformance.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">No team members yet.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {data.teamPerformance.map((m, i) => {
              const pct = Math.round(((m.completed || 0) / maxCompleted) * 100);
              return (
                <li key={m._id} className="group hover:bg-gray-50 p-4 rounded-lg transition-all-smooth" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700 group-hover:text-primary-600 transition-all-smooth">{m.name}</span>
                    <span className="text-sm font-bold text-primary-600">{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-soft">
                    <div 
                      className="h-3 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all-smooth" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{m.completed || 0} completed</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

const MemberDashboard = ({ data }) => {
  const completionRate = data.myTasks
    ? Math.round((data.completedTasks / data.myTasks) * 100)
    : 0;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <StatCard label="My tasks" value={data.myTasks} tone="blue" sublabel={`${completionRate}% completed`} />
        <StatCard label="Completed" value={data.completedTasks} tone="green" />
        <StatCard label="Pending" value={data.pendingTasks} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-8 animate-slide-up">
          <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center gap-2">
            📅 Upcoming Deadlines
          </h3>
          {data.upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nothing on the horizon.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.upcomingDeadlines.map((t) => (
                <li key={t._id} className="flex items-center justify-between p-3 hover:bg-primary-50 rounded-lg transition-all-smooth group cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-all-smooth">{t.title}</span>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full">{formatDate(t.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-elevated p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center gap-2">
            🔔 Recent Activity
          </h3>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.map((t) => (
                <li key={t._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all-smooth group cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 truncate group-hover:text-primary-600 transition-all-smooth">{t.title}</span>
                  <span className={`badge ${statusBadges[t.status] || 'badge-primary'} text-xs`}>{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const url = user.role === 'Admin' ? '/dashboard/admin' : '/dashboard/member';
        const res = await api.get(url);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <DashboardLayout>
      <div className="mb-8 animate-slide-up">
        <h2 className="text-3xl font-bold gradient-text">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome back, <span className="font-semibold text-primary-600">{user?.name}</span> 👋</p>
      </div>
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-bounce-slow text-4xl">⏳</div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 font-medium mb-4">
          ⚠️ {error}
        </div>
      )}
      {data && (user.role === 'Admin' ? <AdminDashboard data={data} /> : <MemberDashboard data={data} />)}
    </DashboardLayout>
  );
};

export default Dashboard;
