import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const res = await User.findOneAndUpdate({ email: 'admin@example.com' }, { designation: 'Project Lead', role: 'Admin' }, { new: true });
  if (!res) {
    console.error('admin user not found');
  } else {
    console.log('Updated user:', res.email, res.designation, res.role);
  }
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
