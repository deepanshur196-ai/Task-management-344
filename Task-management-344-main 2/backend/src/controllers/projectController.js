import Project from '../models/Project.js';

const emit = (req, event, payload) => {
  req.app.get('io')?.emit(event, payload);
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.aggregate([
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'project',
          as: 'tasks',
        },
      },
      {
        $addFields: {
          totalTasks: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'Completed'] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          progress: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$completedTasks', '$totalTasks'] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { memberIds: '$members' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$memberIds'] } } },
            { $project: { name: 1, email: 1, role: 1, designation: 1 } },
          ],
          as: 'members',
        },
      },
      {
        $project: {
          tasks: 0,
          totalTasks: 0,
          completedTasks: 0,
        },
      },
    ]);
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
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (req.user.designation === 'Project Lead' && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Project Leads may only update their own team projects' });
    }
    Object.assign(project, req.body);
    await project.save();
    emit(req, 'project:updated', project);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const addProjectFeedback = async (req, res, next) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Feedback comment required' });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const canSubmit = req.user.role === 'Admin' || ['Project QL', 'Project Lead', 'QA'].includes(req.user.designation);
    if (!canSubmit) {
      return res.status(403).json({ message: 'Only QL or project designation users can add feedback' });
    }

    const entry = {
      author: req.user.id,
      authorName: req.user.name,
      authorDesignation: req.user.designation || req.user.role,
      comment: comment.trim(),
    };
    project.feedback.unshift(entry);
    await project.save();
    emit(req, 'project:updated', project);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (req.user.designation === 'Project Lead' && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Project Leads may only delete their own team projects' });
    }
    await project.remove();
    emit(req, 'project:deleted', { _id: project._id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};
