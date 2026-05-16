import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from './Modal';

const emptyForm = {
  title: '',
  description: '',
  project: '',
  assignedUser: '',
  priority: 'Medium',
  status: 'Todo',
  dueDate: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const TaskFormModal = ({ open, mode = 'create', task, onClose, onSubmit }) => {
  const [form, setForm] = useState(emptyForm);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [pRes, uRes] = await Promise.all([
          api.get('/projects'),
          api.get('/auth/users'),
        ]);
        if (cancelled) return;
        setProjects(pRes.data);
        setUsers(uRes.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load form data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        project: task.project?._id || task.project || '',
        assignedUser: task.assignedUser?._id || task.assignedUser || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Todo',
        dueDate: toDateInput(task.dueDate),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, mode, task]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        project: form.project,
        assignedUser: form.assignedUser || null,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Task' : 'New Task'}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">Cancel</button>
          <button form="task-form" type="submit" disabled={submitting || loading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select name="project" value={form.project} onChange={handleChange} required className="w-full p-2 border rounded">
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignee</label>
              <select name="assignedUser" value={form.assignedUser} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default TaskFormModal;
