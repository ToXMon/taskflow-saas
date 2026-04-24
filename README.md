# TaskFlow SaaS

Full-stack task management application with JWT authentication, CRUD operations, dashboard analytics, and Docker deployment.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+, SQLAlchemy |
| Database | SQLite |
| Auth | JWT (HS256, bcrypt) |
| Deploy | Docker Compose |

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

Frontend: http://localhost:3000 | Backend API docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account, get JWT |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/tasks` | Yes | List tasks (filter, sort, paginate) |
| POST | `/api/tasks` | Yes | Create task |
| GET | `/api/tasks/{id}` | Yes | Get single task |
| PUT | `/api/tasks/{id}` | Yes | Update task |
| DELETE | `/api/tasks/{id}` | Yes | Delete task |
| GET | `/api/dashboard/stats` | Yes | Dashboard statistics |
| GET | `/api/users/me` | Yes | Current user profile |

## Project Structure

```
taskflow-saas/
├── backend/          # FastAPI application
│   ├── app/          # Main application code
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── routers/  # API route handlers
│   │   ├── services/ # Business logic
│   │   └── deps.py   # Dependencies (auth, DB)
│   └── tests/        # pytest test suite
├── frontend/         # Next.js application
│   └── src/
│       ├── app/      # App Router pages
│       ├── components/ # React components
│       ├── hooks/    # Custom React hooks
│       └── lib/      # API client, types, auth helpers
└── docker-compose.yml
```

## Features

- **JWT Auth** — Register/login with bcrypt password hashing
- **Task CRUD** — Create, read, update, delete tasks
- **Task Properties** — Status (todo/in_progress/done), priority (low/medium/high), due dates
- **Row-level Security** — Users can only access their own tasks
- **Dashboard** — Task counts by status, priority breakdown, overdue tracking
- **Filtering & Pagination** — Filter tasks by status/priority, sort, paginate
- **Responsive UI** — Works on mobile and desktop

## Running Tests

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | change-me... | JWT signing key |
| `DATABASE_URL` | sqlite:///./data/taskflow.db | SQLite database path |
| `CORS_ORIGINS` | http://localhost:3000 | Allowed CORS origins |
| `NEXT_PUBLIC_API_URL` | http://localhost:8000 | Backend API URL |
