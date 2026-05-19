import Project from '../models/Project.js';

const emit = (req, event, payload) => {
  req.app.get('io')?.emit(event, payload);
};

export const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    emit(req, 'project:updated', project);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.members = project.members.filter(id => id.toString() !== userId);
    await project.save();
    emit(req, 'project:updated', project);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('members', 'name email role designation');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.members);
  } catch (err) {
    next(err);
  }
};
