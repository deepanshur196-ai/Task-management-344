import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
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

  const teamChartData = data.teamPerformance.map((member) => ({
    name: member.name,
    completed: member.completed || 0,
  }));

  const statusData = [
    { name: 'Completed', value: data.completedTasks },
    { name: 'Pending', value: data.pendingTasks },
  ];
  const chartColors = ['#0ea5e9', '#f59e0b'];

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Projects" value={data.totalProjects} tone="blue" />
        <StatCard label="Total tasks" value={data.totalTasks} tone="gray" sublabel={`${completionRate}% completed`} />
        <StatCard label="Completed" value={data.completedTasks} tone="green" />
        <StatCard label="Pending" value={data.pendingTasks} tone="amber" />
        <StatCard label="Overdue" value={data.overdueTasks} tone="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="card-elevated p-6 animate-slide-up">
          <h3 className="text-xl font-semibold mb-4">Team completion</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6 animate-slide-up">
          <h3 className="text-xl font-semibold mb-4">Task status split</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
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

  const memberStatusData = [
    { name: 'Completed', value: data.completedTasks },
    { name: 'Pending', value: data.pendingTasks },
  ];

  const smallDeadlineData = data.upcomingDeadlines.slice(0, 5).map((task) => ({
    name: task.title.length > 18 ? `${task.title.slice(0, 15)}...` : task.title,
    deadline: new Date(task.dueDate).toLocaleDateString(),
  }));
  const deadlineCounts = data.upcomingDeadlines.reduce((acc, task) => {
    const key = new Date(task.dueDate).toLocaleDateString();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const deadlineChartData = Object.entries(deadlineCounts).map(([name, value]) => ({ name, value }));

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <StatCard label="My tasks" value={data.myTasks} tone="blue" sublabel={`${completionRate}% completed`} />
        <StatCard label="Completed" value={data.completedTasks} tone="green" />
        <StatCard label="Pending" value={data.pendingTasks} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="card-elevated p-6 animate-slide-up">
          <h3 className="text-xl font-semibold mb-4">My progress</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={memberStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={4}>
                  {memberStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#22c55e', '#f59e0b'][index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6 animate-slide-up">
          <h3 className="text-xl font-semibold mb-4">Upcoming deadlines</h3>
          <div className="h-72">
            {deadlineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deadlineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-72 items-center justify-center text-slate-500">No upcoming deadlines yet.</div>
            )}
          </div>
        </div>
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
