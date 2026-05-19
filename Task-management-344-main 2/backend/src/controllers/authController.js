import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      designation: user.designation || 'Member',
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createRandomPassword = () => {
  const prefix = Math.random().toString(36).slice(-6);
  return `${prefix}A1a!`;
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, designation } = req.body;
    if (!name || !email || !password || !role || !designation) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include upper case, lower case, and a number' });
    }
    if (!['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ message: 'Role must be Admin or Member' });
    }
    if (!['Project QL', 'Project Lead', 'QA', 'Member'].includes(designation)) {
      return res.status(400).json({ message: 'Designation must be Project QL, Project Lead, QA, or Member' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const userRole = designation === 'Project Lead' ? 'Admin' : role;
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: userRole,
      designation,
    });
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, designation: user.designation } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const requireProjectLead = (req, res) => {
  if (req.user.designation !== 'Project Lead') {
    return res.status(403).json({ message: 'Forbidden: only Project Lead users can manage My Team' });
  }
  return null;
};

export const inviteTeamMember = async (req, res, next) => {
  try {
    const denied = requireProjectLead(req, res);
    if (denied) return denied;

    const { name, email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.teamLead && existing.teamLead.toString() !== req.user.id) {
        return res.status(409).json({ message: 'This user is already assigned to another lead' });
      }
      existing.teamLead = req.user.id;
      await existing.save();
      return res.status(200).json({
        id: existing._id,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        designation: existing.designation,
        completedTasks: 0,
      });
    }

    const memberName = name?.trim() ? name.trim() : normalizedEmail.split('@')[0].replace(/[._]/g, ' ');
    const password = createRandomPassword();
    const user = await User.create({
      name: memberName || 'Team Member',
      email: normalizedEmail,
      password,
      role: 'Member',
      designation: 'Member',
      teamLead: req.user.id,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      completedTasks: 0,
    });
  } catch (err) {
    next(err);
  }
};

export const getTeamMembers = async (req, res, next) => {
  try {
    const denied = requireProjectLead(req, res);
    if (denied) return denied;

    const members = await User.aggregate([
      { $match: { teamLead: new mongoose.Types.ObjectId(req.user.id) } },
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
          email: 1,
          role: 1,
          designation: 1,
          completedTasks: {
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
    res.json(members);
  } catch (err) {
    next(err);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const denied = requireProjectLead(req, res);
    if (denied) return denied;

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Member id is required' });
    }

    const member = await User.findOne({ _id: id, teamLead: req.user.id });
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    member.teamLead = null;
    await member.save();

    res.json({ message: 'Team member removed from My Team', id: member._id });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, designation: user.designation } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id name email role designation').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof email === 'string' && email.trim()) updates.email = email.trim().toLowerCase();

    if (updates.email) {
      const existing = await User.findOne({ email: updates.email, _id: { $ne: req.user.id } });
      if (existing) return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, designation: user.designation } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
