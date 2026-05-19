import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';

const ProjectMembersModal = ({ open, project, canEdit, onClose, onChange }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!open || !project) return;
    setFeedbacks(project.feedback || []);
  }, [open, project]);

  const canSubmitFeedback = user && (user.role === 'Admin' || ['Project QL', 'Project Lead', 'QA'].includes(user.designation));

  const handleFeedbackSubmit = async () => {
    if (!feedbackComment.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/projects/${project._id}/feedback`, { comment: feedbackComment.trim() });
      setFeedbacks((prev) => [res.data, ...prev]);
      setFeedbackComment('');
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Feedback — ${project?.name || ''}`}
      footer={<button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">Close</button>}
    >
      <div className="space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {canSubmitFeedback && (
          <div className="space-y-3">
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              rows={4}
              placeholder="Write feedback for this project..."
              className="w-full p-3 border rounded resize-none"
            />
            <button
              type="button"
              onClick={handleFeedbackSubmit}
              disabled={loading}
              className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit feedback'}
            </button>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Project feedback</h4>
            <span className="text-xs text-gray-500">{feedbacks.length} entries</span>
          </div>
          {feedbacks.length === 0 ? (
            <div className="text-sm text-gray-500">No project feedback yet.</div>
          ) : (
            <ul className="space-y-3">
              {feedbacks.map((entry, index) => (
                <li key={`${entry.author}-${index}`} className="rounded border p-3 bg-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{entry.authorName}</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm font-medium mb-1">{entry.authorDesignation}</div>
                  <p className="text-sm text-slate-700">{entry.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProjectMembersModal;
