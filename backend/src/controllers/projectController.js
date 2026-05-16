import Project from '../models/Project.js';

const emit = (req, event, payload) => {
  req.app.get('io')?.emit(event, payload);
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find().populate('members', 'name email role');
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description, deadline, members } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });
    const project = await Project.create({
      name,
      description,
      deadline,
      createdBy: req.user.id,
      members: members || [req.user.id]
    });
    emit(req, 'project:created', project);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    emit(req, 'project:updated', project);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    emit(req, 'project:deleted', { _id: project._id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};
