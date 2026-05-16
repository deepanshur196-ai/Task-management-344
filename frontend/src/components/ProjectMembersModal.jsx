import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import Modal from './Modal';

const ProjectMembersModal = ({ open, project, canEdit, onClose, onChange }) => {
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickerId, setPickerId] = useState('');

  useEffect(() => {
    if (!open || !project) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, membersRes] = await Promise.all([
          api.get('/auth/users'),
          api.get(`/projects/${project._id}/members`),
        ]);
        if (cancelled) return;
        setUsers(usersRes.data);
        setMembers(membersRes.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load members');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, project]);

  const memberIds = useMemo(() => new Set(members.map((m) => m._id)), [members]);
  const availableUsers = useMemo(
    () => users.filter((u) => !memberIds.has(u._id)),
    [users, memberIds]
  );

  const handleAdd = async () => {
    if (!pickerId) return;
    setError('');
    try {
      await api.post(`/projects/${project._id}/members/add`, { userId: pickerId });
      const added = users.find((u) => u._id === pickerId);
      if (added) setMembers((prev) => [...prev, added]);
      setPickerId('');
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemove = async (userId) => {
    setError('');
    try {
      await api.post(`/projects/${project._id}/members/remove`, { userId });
      setMembers((prev) => prev.filter((m) => m._id !== userId));
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Members — ${project?.name || ''}`}
      footer={<button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">Close</button>}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {canEdit && (
            <div className="flex gap-2">
              <select
                value={pickerId}
                onChange={(e) => setPickerId(e.target.value)}
                className="flex-1 p-2 border rounded"
              >
                <option value="">Select a user to add...</option>
                {availableUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email}) — {u.role}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!pickerId}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Add
              </button>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Current members ({members.length})</h4>
            {members.length === 0 ? (
              <div className="text-sm text-gray-500">No members yet.</div>
            ) : (
              <ul className="divide-y border rounded">
                {members.map((m) => (
                  <li key={m._id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.email} · {m.role}</div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemove(m._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProjectMembersModal;
