import Task from '../models/Task.js';
import { paginate } from '../utils/pagination.js';
import { buildTaskQuery } from '../utils/searchFilter.js';

const ALLOWED_SORTS = new Set(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title']);

const emit = (req, event, payload) => {
  req.app.get('io')?.emit(event, payload);
};

export const getTasks = async (req, res, next) => {
  try {
    const { search, status, priority, project, assignedUser, sortBy, order } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const filter = buildTaskQuery({ search, status, priority, project, assignedUser });
    const sortField = ALLOWED_SORTS.has(sortBy) ? sortBy : 'createdAt';
    const sortDir = order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      paginate(
        Task.find(filter)
          .sort({ [sortField]: sortDir })
          .populate('assignedUser', 'name email')
          .populate('project', 'name'),
        { page, limit }
      ),
      Task.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedUser, project, priority, dueDate, status } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'Title and project required' });
    const created = await Task.create({
      title,
      description,
      assignedUser: assignedUser || undefined,
      project,
      priority,
      status,
      dueDate: dueDate || undefined,
      createdBy: req.user.id
    });
    const task = await Task.findById(created._id)
      .populate('assignedUser', 'name email')
      .populate('project', 'name');
    emit(req, 'task:created', task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedUser', 'name email')
      .populate('project', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    emit(req, 'task:updated', task);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    emit(req, 'task:deleted', { _id: task._id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
