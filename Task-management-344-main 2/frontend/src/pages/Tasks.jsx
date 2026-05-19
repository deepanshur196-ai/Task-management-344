import { useCallback, useEffect, useMemo, useState } from 'react';
import TaskDetailsModal from '../components/TaskDetailsModal';
import TaskFormModal from '../components/TaskFormModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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
  const { addNotification } = useNotifications();
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
  const [viewMode, setViewMode] = useState('table');

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

  useSocketEvent('task:created', useCallback((created) => {
    addNotification({ message: `New task created: ${created.title}`, type: 'info' });
    loadTasks();
  }, [addNotification, loadTasks]));

  useSocketEvent('task:updated', useCallback((updated) => {
    addNotification({ message: `Task updated: ${updated.title}`, type: 'success' });
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
  }, [addNotification]));

  useSocketEvent('task:deleted', useCallback(({ _id }) => {
    addNotification({ message: 'A task was deleted', type: 'warning' });
    setTasks((prev) => prev.filter((t) => t._id !== _id));
  }, [addNotification]));

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

  const canUpdateStatus = (task) => isAdmin || task.assignedUser?._id === user?.id;

  const handleSubmit = async (payload) => {
    try {
      if (formMode === 'edit' && activeTask) {
        await api.put(`/tasks/${activeTask._id}`, payload);
        addNotification({ message: `Task updated: ${payload.title || activeTask.title}`, type: 'success' });
      } else {
        await api.post('/tasks', payload);
        addNotification({ message: `Task created: ${payload.title}`, type: 'success' });
      }
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
      addNotification({ message: err.response?.data?.message || 'Failed to save task', type: 'error' });
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      addNotification({ message: `Task deleted: ${task.title}`, type: 'warning' });
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      addNotification({ message: err.response?.data?.message || 'Failed to delete task', type: 'error' });
    }
  };

  const handleQuickStatus = async (task, status) => {
    try {
      const res = await api.put(`/tasks/${task._id}`, { status });
      addNotification({ message: `Status changed: ${task.title} → ${status}`, type: 'success' });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, ...res.data } : t)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      addNotification({ message: err.response?.data?.message || 'Failed to update task', type: 'error' });
    }
  };

  const statusColumns = ['Todo', 'In Progress', 'Completed'];
  const groupedTasks = useMemo(
    () => statusColumns.reduce((acc, status) => ({
      ...acc,
      [status]: tasks.filter((task) => task.status === status),
    }), {}),
    [tasks]
  );

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

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-full border bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-full ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            Table view
          </button>
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`px-4 py-2 rounded-full ${viewMode === 'board' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            Board view
          </button>
        </div>
        <div className="text-sm text-slate-500">Showing {tasks.length} task{tasks.length === 1 ? '' : 's'}</div>
      </div>

      {viewMode === 'board' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {statusColumns.map((status) => (
            <div key={status} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">{status}</div>
                <div className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  {groupedTasks[status]?.length ?? 0}
                </div>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-sm text-slate-500">Loading...</div>
                ) : groupedTasks[status]?.length === 0 ? (
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">No tasks.</div>
                ) : (
                  groupedTasks[status].map((t) => (
                    <div key={t._id} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 transition hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <button onClick={() => openDetails(t)} className="text-left text-sm font-semibold text-slate-900 hover:text-blue-600">
                          {t.title}
                        </button>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full px-2 py-1 ${statusStyles[t.status] || 'bg-slate-100 text-slate-700'}`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500 space-y-2">
                        <div>Project: {t.project?.name || '—'}</div>
                        <div>Assignee: {t.assignedUser?.name || 'Unassigned'}</div>
                        <div>Due: <span className={isOverdue(t) ? 'text-red-600 font-medium' : ''}>{formatDate(t.dueDate)}</span></div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${priorityStyles[t.priority] || 'bg-slate-100 text-slate-700'}`}>{t.priority}</span>
                        <select
                          value={t.status}
                          onChange={(e) => handleQuickStatus(t, e.target.value)}
                          className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                          disabled={!canUpdateStatus(t)}
                          title={!canUpdateStatus(t) ? 'Only admin or assigned member may update status' : 'Change status'}
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(t)} className="text-sm text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(t)} className="text-sm text-red-600 hover:underline">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                          disabled={!canUpdateStatus(t)}
                          title={!canUpdateStatus(t) ? 'Only admin or assigned member may update status' : 'Change status'}
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
      )}

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
