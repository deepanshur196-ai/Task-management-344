import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Project from './models/Project.js';
import Task from './models/Task.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    await User.deleteMany();
    await Project.deleteMany();
    await Task.deleteMany();
    // Create sample users
    const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'Admin1234', role: 'Admin' });
    const member = await User.create({ name: 'Member User', email: 'member@example.com', password: 'Member1234', role: 'Member' });
    // Create sample project
    const project = await Project.create({ name: 'Sample Project', description: 'Demo project', deadline: new Date(Date.now() + 7*24*60*60*1000), createdBy: admin._id, members: [admin._id, member._id] });
    // Create sample task
    await Task.create({ title: 'Sample Task', description: 'Demo task', assignedUser: member._id, project: project._id, priority: 'High', status: 'Todo', dueDate: new Date(Date.now() + 3*24*60*60*1000), createdBy: admin._id });
    console.log('Seed data created');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
