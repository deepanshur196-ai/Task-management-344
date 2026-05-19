import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';

const Profile = () => {
  const { user, login } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileStatus, setProfileStatus] = useState({ loading: false, error: '', success: '' });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState({ loading: false, error: '', success: '' });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileStatus({ loading: true, error: '', success: '' });
    try {
      const res = await api.patch('/auth/me', profile);
      login(res.data.user, res.data.token);
      setProfileStatus({ loading: false, error: '', success: 'Profile updated' });
    } catch (err) {
      setProfileStatus({ loading: false, error: err.response?.data?.message || 'Failed to update profile', success: '' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwStatus({ loading: false, error: 'New password and confirmation do not match', success: '' });
      return;
    }
    setPwStatus({ loading: true, error: '', success: '' });
    try {
      await api.patch('/auth/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwStatus({ loading: false, error: '', success: 'Password updated' });
    } catch (err) {
      setPwStatus({ loading: false, error: err.response?.data?.message || 'Failed to update password', success: '' });
    }
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-6">Profile</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Account details</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileStatus.error && <div className="text-red-500 text-sm">{profileStatus.error}</div>}
            {profileStatus.success && <div className="text-green-600 text-sm">{profileStatus.success}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <input value={user?.role || ''} disabled className="w-full p-2 border rounded bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input value={user?.designation || 'Member'} disabled className="w-full p-2 border rounded bg-gray-50 text-gray-500" />
            </div>
            <button
              type="submit"
              disabled={profileStatus.loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {profileStatus.loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Change password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {pwStatus.error && <div className="text-red-500 text-sm">{pwStatus.error}</div>}
            {pwStatus.success && <div className="text-green-600 text-sm">{pwStatus.success}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Current password</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New password</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm new password</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                required
                minLength={6}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              disabled={pwStatus.loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {pwStatus.loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
