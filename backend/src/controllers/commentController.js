import Comment from '../models/Comment.js';
import Task from '../models/Task.js';

export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });
    const created = await Comment.create({
      text,
      user: req.user.id,
      task: req.params.taskId
    });
    await Task.findByIdAndUpdate(req.params.taskId, { $push: { comments: created._id } });
    const comment = await Comment.findById(created._id).populate('user', 'name email');
    req.app.get('io')?.emit('comment:created', { taskId: req.params.taskId, comment });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId }).populate('user', 'name email');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};
