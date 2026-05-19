#  You Can Access the project with this link - https://task-management-344-production.up.railway.app/
# Ethara — Collaborative Task Management

A full-stack collaborative task management platform with role-based access (Admin/Member), real-time updates via Socket.IO, and a modern Tailwind UI.

**Live URL:** _add after Railway deployment_
**Repository:** _add after GitHub push_

---

## Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Role-based access** — Admin can create/edit/delete projects + tasks; Members manage their own task status and comment
- **Projects** — create, edit, archive, manage members per project
- **Tasks** — create, assign, set priority/due date, change status; supports search, filter (status/priority/project), sort, and pagination
- **Real-time updates** — Socket.IO broadcasts project/task/comment events; all connected clients update live
- **Dashboard** — Admin sees totals, completion rate, overdue counts, team performance bars; Members see their own tasks, upcoming deadlines, recent activity
- **Profile** — edit name/email and change password
- **Comments** — thread per task with live updates
- **Responsive UI** — Tailwind CSS, modal-driven workflows

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios, Socket.IO client |
| Backend | Node.js, Express 4, Mongoose, Socket.IO, JWT, bcrypt, multer |
| Database | MongoDB (Atlas) |
| Deployment | Railway (single Node service serving API + built frontend) |

## Project Structure

```
ethara/
├── backend/
│   ├── src/
│   │   ├── controllers/      auth, project, task, comment, member, dashboard, upload
│   │   ├── models/           User, Project, Task, Comment
│   │   ├── routes/           REST endpoints
│   │   ├── middleware/       auth, errorHandler
│   │   ├── utils/            pagination, searchFilter, validators, fileUpload
│   │   └── server.js         Express + Socket.IO entry point
│   ├── uploads/              file storage (ephemeral on Railway)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            Landing, Login, Signup, Dashboard, Projects, Tasks, Profile
│   │   ├── components/       Sidebar, Topbar, Modal, ProjectFormModal, ProjectMembersModal, TaskFormModal, TaskDetailsModal, StatCard, ProtectedRoute
│   │   ├── context/          AuthContext
│   │   ├── hooks/            useSocket
│   │   ├── services/         api (axios), socket
│   │   └── App.jsx
│   └── package.json
├── package.json              root orchestrator for Railway
├── railway.json              Railway build/start config
└── .gitignore
```

## REST API

Base path: `/api`

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | public | create account |
| POST | `/auth/login` | public | sign in, returns JWT |
| GET | `/auth/me` | any | current user |
| PATCH | `/auth/me` | any | update name/email |
| PATCH | `/auth/me/password` | any | change password |
| GET | `/auth/users` | any | list users (for member picker) |
| GET | `/projects` | any | list projects |
| POST | `/projects` | Admin | create project |
| PUT | `/projects/:id` | Admin | update project |
| DELETE | `/projects/:id` | Admin | delete project |
| GET | `/projects/:projectId/members` | any | project members |
| POST | `/projects/:projectId/members/add` | Admin | add member |
| POST | `/projects/:projectId/members/remove` | Admin | remove member |
| GET | `/tasks` | any | list tasks (supports `search`, `status`, `priority`, `project`, `assignedUser`, `sortBy`, `order`, `page`, `limit`) |
| POST | `/tasks` | Admin | create task |
| PUT | `/tasks/:id` | Admin/Member | update task |
| DELETE | `/tasks/:id` | Admin | delete task |
| GET | `/tasks/:taskId/comments` | any | list comments |
| POST | `/tasks/:taskId/comments` | any | add comment |
| GET | `/dashboard/admin` | Admin | admin stats + team performance |
| GET | `/dashboard/member` | Member | personal stats + upcoming + recent |
| POST | `/upload` | any | upload file attachment |
| GET | `/health` | public | health check |

## Socket.IO Events (server → client)

- `project:created`, `project:updated`, `project:deleted`
- `task:created`, `task:updated`, `task:deleted`
- `comment:created` — payload `{ taskId, comment }`

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas connection string (free M0 cluster works)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ethara
npm run build        # installs backend + frontend deps and builds frontend
```

### 2. Configure environment

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ethara?retryWrites=true&w=majority
JWT_SECRET=<long-random-string>
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run in development (two terminals)

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173/`.

## Deployment (Railway)

This project deploys as a **single Railway service**. Express serves the built React app from `frontend/dist`, and the API lives under `/api`. No CORS needed in production.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/ethara.git
git push -u origin main
```

### 2. Create Railway service

1. Sign in at [railway.com](https://railway.com) (GitHub OAuth)
2. **New Project → Deploy from GitHub repo → select `ethara`**
3. Railway auto-detects the root `package.json` and runs `npm run build` then `npm start`

### 3. Set environment variables

In the Railway service → **Variables** tab, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | a long random string |
| `CLIENT_URL` | leave empty or set to `*` (same-origin in single-service deploy) |

`PORT` is provided by Railway automatically.

### 4. Expose a public URL

Service → **Settings → Networking → Generate Domain**. Railway gives you `https://ethara-production.up.railway.app` (or similar).

### 5. Whitelist Railway IPs on Atlas

In MongoDB Atlas → **Network Access** → **Add IP Address** → `0.0.0.0/0` (or use Railway's static egress IP if configured). Save.

That's it. Open the Railway URL and you should see the Landing page.

## Roles

| Action | Admin | Member |
|---|---|---|
| Sign up / log in | ✓ | ✓ |
| View projects/tasks | ✓ | ✓ |
| Create/edit/delete project | ✓ | — |
| Manage project members | ✓ | — |
| Create/delete task | ✓ | — |
| Update task status | ✓ | ✓ |
| Comment on task | ✓ | ✓ |
| View admin dashboard | ✓ | — |

## Notes / Limitations

- File uploads use local disk storage in `backend/uploads/`. Railway's filesystem is ephemeral, so attachments are wiped on redeploy. For production use, swap to S3 / Cloudinary.
- Socket.IO uses default `/socket.io` path on the same origin in production.
- Activity log utility exists at [backend/src/utils/activityLogger.js](backend/src/utils/activityLogger.js) but is not yet wired into the controllers.

## License

MIT
