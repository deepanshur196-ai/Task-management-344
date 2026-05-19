import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member', designation: 'Member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'designation') {
      setForm((prev) => ({
        ...prev,
        designation: value,
        role: value === 'Project Lead' ? 'Admin' : prev.role === 'Admin' && prev.designation === 'Project Lead' ? 'Member' : prev.role,
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-sky-100 to-violet-200 text-slate-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.25),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_25%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="card p-10 shadow-soft-lg max-w-xl w-full border border-slate-200 dark:border-slate-700">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-primary-700 dark:text-primary-300">Create account</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Join your team workspace</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Build tasks, collaborate with teammates, and stay on top of deadlines.</p>
          </div>
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className="input-field bg-slate-50 dark:bg-slate-900"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="input-field bg-slate-50 dark:bg-slate-900"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="input-field bg-slate-50 dark:bg-slate-900 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <select
              name="designation"
              value={form.designation}
              onChange={handleChange}
              className="input-field bg-slate-50 dark:bg-slate-900"
            >
              <option value="Member">Member</option>
              <option value="Project Lead">Project Lead</option>
              <option value="Project QL">Project QL</option>
              <option value="QA">QA</option>
            </select>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="input-field bg-slate-50 dark:bg-slate-900"
              disabled={form.designation === 'Project Lead'}
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
            </select>
            {form.designation === 'Project Lead' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Project Lead designation automatically assigns Admin access.</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Already have an account?</span>
            <Link to="/login" className="text-primary-700 font-semibold hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
