import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

export const adminDashboard = async (req, res, next) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });
    const overdueTasks = await Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'Completed' } });
    // Team performance: count completed tasks per user
    const teamPerformance = await User.aggregate([
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'assignedUser',
          as: 'tasks'
        }
      },
      {
        $project: {
          name: 1,
          completed: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'Completed'] }
              }
            }
          }
        }
      }
    ]);
    res.json({ totalProjects, totalTasks, completedTasks, pendingTasks, overdueTasks, teamPerformance });
  } catch (err) {
    next(err);
  }
};

export const memberDashboard = async (req, res, next) => {
  try {
    const myTasks = await Task.find({ assignedUser: req.user.id });
    const completedTasks = myTasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = myTasks.filter(t => t.status !== 'Completed').length;
    const upcomingDeadlines = myTasks.filter(t => t.dueDate && t.dueDate > new Date());
    // Recent activity: last 5 updated tasks
    const recentActivity = await Task.find({ assignedUser: req.user.id }).sort({ updatedAt: -1 }).limit(5);
    res.json({ myTasks: myTasks.length, completedTasks, pendingTasks, upcomingDeadlines, recentActivity });
  } catch (err) {
    next(err);
  }
};
