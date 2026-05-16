import { useCallback, useEffect, useState } from 'react';
import TaskDetailsModal from '../components/TaskDetailsModal';
import TaskFormModal from '../components/TaskFormModal';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../hooks/useSocket';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';

const statusStyles = {
  Todo: 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-700',
};
const priorityStyles = {
  Low: 'bg-blue-50 text-blue-700',
  Medium: 'bg-amber-50 text-amber-700',
  High: 'bg-red-50 text-red-700',
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const isOverdue = (task) =>
  task.dueDate && task.status !== 'Completed' && new Date(task.dueDate) < new Date();

const Tasks = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [projects, setProjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeTask, setActiveTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data)).catch(() => {});
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: meta.limit,
        sortBy,
        order,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (projectFilter) params.project = projectFilter;
      const res = await api.get('/tasks', { params });
      setTasks(res.data.items);
      setMeta({ total: res.data.total, page: res.data.page, pages: res.data.pages, limit: res.data.limit });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, meta.limit, sortBy, order, search, statusFilter, priorityFilter, projectFilter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, projectFilter, sortBy, order]);

  useSocketEvent('task:created', loadTasks);
  useSocketEvent('task:updated', useCallback((updated) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
  }, []));
  useSocketEvent('task:deleted', useCallback(({ _id }) => {
    setTasks((prev) => prev.filter((t) => t._id !== _id));
  }, []));

  const openCreate = () => {
    setFormMode('create');
    setActiveTask(null);
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setFormMode('edit');
    setActiveTask(task);
    setFormOpen(true);
  };

  const openDetails = (task) => {
    setDetailsTask(task);
    setDetailsOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (formMode === 'edit' && activeTask) {
      await api.put(`/tasks/${activeTask._id}`, payload);
    } else {
      await api.post('/tasks', payload);
    }
    loadTasks();
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleQuickStatus = async (task, status) => {
    try {
      const res = await api.put(`/tasks/${task._id}`, { status });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, ...res.data } : t)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tasks</h2>
        {isAdmin && (
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + New Task
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow p-4 mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="p-2 border rounded lg:col-span-2"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 p-2 border rounded">
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="title">Title</option>
          </select>
          <button
            type="button"
            onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="px-3 border rounded hover:bg-gray-50"
            title={order === 'asc' ? 'Ascending' : 'Descending'}
          >
            {order === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Assignee</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No tasks found.</td></tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <button onClick={() => openDetails(t)} className="text-blue-600 hover:underline text-left">
                        {t.title}
                      </button>
                    </td>
                    <td className="px-4 py-2">{t.project?.name || '—'}</td>
                    <td className="px-4 py-2">{t.assignedUser?.name || <span className="text-gray-400">Unassigned</span>}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded ${priorityStyles[t.priority] || ''}`}>{t.priority}</span>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={t.status}
                        onChange={(e) => handleQuickStatus(t, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${statusStyles[t.status] || ''}`}
                      >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className={`px-4 py-2 ${isOverdue(t) ? 'text-red-600 font-medium' : ''}`}>
                      {formatDate(t.dueDate)}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {isAdmin && (
                        <>
                          <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline mr-3">Edit</button>
                          <button onClick={() => handleDelete(t)} className="text-red-600 hover:underline">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
          <div className="text-gray-600">
            {meta.total === 0 ? '0 results' : `Page ${meta.page} of ${meta.pages} · ${meta.total} total`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={meta.page <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, meta.pages))}
              disabled={meta.page >= meta.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <TaskFormModal
        open={formOpen}
        mode={formMode}
        task={activeTask}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <TaskDetailsModal
        open={detailsOpen}
        task={detailsTask}
        onClose={() => setDetailsOpen(false)}
      />
    </DashboardLayout>
  );
};

export default Tasks;
