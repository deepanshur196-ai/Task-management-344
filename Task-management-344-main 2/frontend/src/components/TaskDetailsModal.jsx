import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../hooks/useSocket';
import api from '../services/api';
import Modal from './Modal';

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
};

const TaskDetailsModal = ({ open, task, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/tasks/${task._id}/comments`);
        if (!cancelled) setComments(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load comments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, task]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: text.trim() });
      const created = { ...res.data, user: res.data.user || { _id: user.id, name: user.name, email: user.email } };
      setComments((prev) => (prev.some((c) => c._id === created._id) ? prev : [...prev, created]));
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  useSocketEvent(
    'comment:created',
    useCallback(
      (payload) => {
        if (!task || payload.taskId !== task._id) return;
        setComments((prev) => (prev.some((c) => c._id === payload.comment._id) ? prev : [...prev, payload.comment]));
      },
      [task]
    ),
    !!task && open
  );

  if (!task) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task.title}
      footer={<button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">Close</button>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Project:</span> {task.project?.name || '—'}</div>
          <div><span className="text-gray-500">Assignee:</span> {task.assignedUser?.name || 'Unassigned'}</div>
          <div><span className="text-gray-500">Status:</span> {task.status}</div>
          <div><span className="text-gray-500">Priority:</span> {task.priority}</div>
          <div className="col-span-2"><span className="text-gray-500">Due:</span> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</div>
        </div>

        {task.description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2">Comments ({comments.length})</h4>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.length === 0 && (
                <li className="text-sm text-gray-500 italic">No comments yet.</li>
              )}
              {comments.map((c) => (
                <li key={c._id} className="bg-gray-50 border rounded px-3 py-2">
                  <div className="text-xs text-gray-500 mb-1">
                    {c.user?.name || 'Someone'} · {formatDateTime(c.createdAt)}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{c.text}</div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handlePost} className="mt-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-2 border rounded text-sm"
            />
            <button
              type="submit"
              disabled={!text.trim() || posting}
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-sm"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;
