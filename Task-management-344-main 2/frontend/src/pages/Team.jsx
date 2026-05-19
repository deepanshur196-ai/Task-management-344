import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSocketEvent } from '../hooks/useSocket';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';

const Team = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isProjectLead = user?.designation === 'Project Lead';

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [removeLoadingId, setRemoveLoadingId] = useState(null);

  const loadTeamMembers = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/auth/team-members');
      setTeamMembers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isProjectLead) {
      loadTeamMembers();
    }
  }, [isProjectLead, loadTeamMembers]);

  useSocketEvent('task:updated', loadTeamMembers);
  useSocketEvent('task:created', loadTeamMembers);

  const handleInvite = async (event) => {
    event.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('Email is required');
      return;
    }

    const name = inviteName.trim() || email.split('@')[0].replace(/[._]/g, ' ').trim() || 'Team Member';

    try {
      setInviteLoading(true);
      const res = await api.post('/auth/team-members/invite', { email, name });
      setTeamMembers((prev) => [res.data, ...prev]);
      setInviteSuccess(`Team member ${email} has been invited.`);
      setInviteEmail('');
      setInviteName('');
      addNotification({ message: `Invited ${email} to My Team`, type: 'success' });
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to invite team member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (memberId, memberName) => {
    setRemoveLoadingId(memberId);
    try {
      await api.delete(`/auth/team-members/${memberId}`);
      setTeamMembers((prev) => prev.filter((member) => {
        const currentId = member._id?.toString() || member.id;
        return currentId !== memberId;
      }));
      addNotification({ message: `${memberName} has been removed from My Team.`, type: 'success' });
    } catch (err) {
      addNotification({ message: err.response?.data?.message || 'Failed to remove team member', type: 'error' });
    } finally {
      setRemoveLoadingId(null);
    }
  };

  if (!isProjectLead) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Team</h1>
            <p className="text-sm text-slate-500 mt-1">Invite members by email. My Team stays empty until you add someone.</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">Quick invite</h2>
            {inviteError && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{inviteError}</div>
            )}
            {inviteSuccess && (
              <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{inviteSuccess}</div>
            )}
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Name (optional)"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
              <button
                type="submit"
                disabled={inviteLoading || !inviteEmail.trim()}
                className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {inviteLoading ? 'Inviting…' : 'Invite member'}
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Team members</div>
            <div className="mt-3 text-3xl font-semibold">{teamMembers.length}</div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Completed tasks</div>
            <div className="mt-3 text-3xl font-semibold">{teamMembers.reduce((count, member) => count + (member.completedTasks || 0), 0)}</div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Active roster</div>
            <div className="mt-3 text-3xl font-semibold">{teamMembers.length}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Team roster</h2>
            <p className="text-sm text-slate-500">Only members you explicitly add will appear here.</p>
          </div>

          {loading ? (
            <div className="text-slate-500">Loading team members…</div>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              My Team is empty. Invite members by email to populate this section.
            </div>
          ) : (
            <ul className="space-y-3">
              {teamMembers.map((member) => {
                const memberId = member._id?.toString() || member.id;
                return (
                  <li key={memberId} className="flex flex-col gap-3 rounded-xl border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-slate-500">{member.email}</div>
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400 mt-2">
                        {member.role} {member.designation ? `· ${member.designation}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:items-end">
                      <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {member.completedTasks ?? 0} completed
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(memberId, member.name)}
                        disabled={removeLoadingId === memberId}
                        className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removeLoadingId === memberId ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      </div>
    </DashboardLayout>
  );
};

export default Team;
