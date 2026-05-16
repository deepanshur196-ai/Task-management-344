import { useCallback, useEffect, useMemo, useState } from 'react';
import ProjectFormModal from '../components/ProjectFormModal';
import ProjectMembersModal from '../components/ProjectMembersModal';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../hooks/useSocket';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';

const statusStyles = {
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
  Archived: 'bg-gray-200 text-gray-700',
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const Projects = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeProject, setActiveProject] = useState(null);

  const [membersOpen, setMembersOpen] = useState(false);
  const [membersProject, setMembersProject] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useSocketEvent('project:created', loadProjects);
  useSocketEvent('project:updated', useCallback((updated) => {
    setProjects((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)));
  }, []));
  useSocketEvent('project:deleted', useCallback(({ _id }) => {
    setProjects((prev) => prev.filter((p) => p._id !== _id));
  }, []));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [projects, search, statusFilter]);

  const openCreate = () => {
    setFormMode('create');
    setActiveProject(null);
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setFormMode('edit');
    setActiveProject(project);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (formMode === 'edit' && activeProject) {
      const res = await api.put(`/projects/${activeProject._id}`, payload);
      setProjects((prev) => prev.map((p) => (p._id === res.data._id ? { ...p, ...res.data } : p)));
    } else {
      const res = await api.post('/projects', payload);
      setProjects((prev) => [res.data, ...prev]);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      setProjects((prev) => prev.filter((p) => p._id !== project._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const openMembers = (project) => {
    setMembersProject(project);
    setMembersOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        {isAdmin && (
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + New Project
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or description..."
          className="flex-1 p-2 border rounded"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center text-gray-500">
          {projects.length === 0 ? 'No projects yet.' : 'No projects match your filters.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p._id} className="bg-white rounded shadow p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${statusStyles[p.status] || 'bg-gray-100 text-gray-700'}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[3rem]">
                {p.description || <span className="italic text-gray-400">No description</span>}
              </p>
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                <div>Deadline: {formatDate(p.deadline)}</div>
                <div>Members: {p.members?.length ?? 0}</div>
                <div>Progress: {p.progress ?? 0}%</div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t">
                <button onClick={() => openMembers(p)} className="text-sm px-3 py-1 rounded border hover:bg-gray-50">
                  Members
                </button>
                {isAdmin && (
                  <>
                    <button onClick={() => openEdit(p)} className="text-sm px-3 py-1 rounded border hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-sm px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal
        open={formOpen}
        mode={formMode}
        project={activeProject}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ProjectMembersModal
        open={membersOpen}
        project={membersProject}
        canEdit={isAdmin}
        onClose={() => setMembersOpen(false)}
        onChange={loadProjects}
      />
    </DashboardLayout>
  );
};

export default Projects;
