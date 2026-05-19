import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import mongoose from 'mongoose';
import morgan from 'morgan';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import dashboardRoutes from './routes/dashboard.js';
import memberRoutes from './routes/members.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import uploadRoutes from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// In production single-service deploys, the frontend lives at the same origin as
// the API, so we reflect the request origin. In dev we enforce the allowlist.
const corsOptions = isProd
  ? { origin: true, credentials: true }
  : {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    };

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: corsOptions });
app.set('io', io);

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan(isProd ? 'combined' : 'dev'));

if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI is not set');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/members', memberRoutes);
app.use('/api/tasks/:taskId/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/tasks', taskRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the built React app from this same service when the build exists.
const distPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});
