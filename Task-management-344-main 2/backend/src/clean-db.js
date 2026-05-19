import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const collectionsToDrop = ['users', 'projects', 'tasks', 'comments'];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in backend/.env — aborting');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;
    const existing = await db.listCollections().toArray();
    const existingNames = existing.map((c) => c.name);
    for (const name of collectionsToDrop) {
      if (existingNames.includes(name)) {
        console.log(`Dropping collection: ${name}`);
        await db.dropCollection(name);
      } else {
        console.log(`Collection not found, skipping: ${name}`);
      }
    }

    console.log('Cleanup complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

run();
