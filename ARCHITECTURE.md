# TaskFlow SaaS — Architecture Document

> Lean, production-ready full-stack task management application.
> Stack: Next.js 14+ (App Router) / FastAPI (Python 3.11+) / SQLite / JWT / Docker

---

## 1. Directory Tree

```
taskflow-saas/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/           # DB migrations
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entry, CORS, lifespan
│   │   ├── config.py           # Settings via pydantic-settings
│   │   ├── database.py         # SQLite engine, session factory
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py         # SQLAlchemy User model
│   │   │   └── task.py         # SQLAlchemy Task model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # RegisterRequest, LoginRequest, TokenResponse
│   │   │   ├── user.py         # UserResponse
│   │   │   └── task.py         # TaskCreate, TaskUpdate, TaskResponse
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # POST /register, POST /login
│   │   │   ├── tasks.py        # CRUD /tasks
│   │   │   └── dashboard.py    # GET /dashboard/stats
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Password hashing, JWT creation/verification
│   │   │   └── tasks.py        # Task business logic
│   │   └── deps.py             # get_db, get_current_user dependencies
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py         # Test client, in-memory DB fixture
│       ├── test_auth.py
│       └── test_tasks.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── public/
    │   └── favicon.ico
    └── src/
        ├── app/
        │   ├── layout.tsx        # Root layout, providers
        │   ├── page.tsx          # Redirect to /dashboard or /login
        │   ├── login/
        │   │   └── page.tsx      # Login form
        │   ├── register/
        │   │   └── page.tsx      # Registration form
        │   ├── dashboard/
        │   │   └── page.tsx      # Task statistics dashboard
        │   └── tasks/
        │       ├── page.tsx      # Task list with filters
        │       ├── new/
        │       │   └── page.tsx  # Create task form
        │       └── [id]/
        │           └── page.tsx  # View/edit single task
        ├── components/
        │   ├── auth/
        │   │   ├── login-form.tsx
        │   │   └── register-form.tsx
        │   ├── tasks/
        │   │   ├── task-card.tsx
        │   │   ├── task-list.tsx
        │   │   ├── task-form.tsx
        │   │   └── task-filters.tsx
        │   ├── dashboard/
        │   │   ├── stats-card.tsx
        │   │   ├── status-breakdown.tsx
        │   │   └── priority-chart.tsx
        │   └── ui/
        │       ├── button.tsx
        │       ├── input.tsx
        │       ├── select.tsx
        │       ├── badge.tsx
        │       └── loading.tsx
        ├── lib/
        │   ├── api.ts            # Fetch wrapper with JWT interceptor
        │   ├── auth.ts           # Token storage, decode helpers
        │   └── types.ts          # TypeScript interfaces
        └── hooks/
            ├── use-auth.ts
            ├── use-tasks.ts
            └── use-dashboard.ts
```

---

## 2. Database Schema

SQLite with SQLAlchemy ORM. Two tables, one foreign key.

### `users`

| Column            | Type         | Constraints                         |
|-------------------|--------------|-------------------------------------|
| `id`              | INTEGER      | PK, AUTOINCREMENT                   |
| `email`           | VARCHAR(255) | UNIQUE, NOT NULL                    |
| `hashed_password` | VARCHAR(255) | NOT NULL                            |
| `full_name`       | VARCHAR(255) | NOT NULL                            |
| `created_at`      | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at`      | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### `tasks`

| Column       | Type         | Constraints                                                    |
|--------------|--------------|----------------------------------------------------------------|
| `id`         | INTEGER      | PK, AUTOINCREMENT                                              |
| `title`      | VARCHAR(255) | NOT NULL                                                       |
| `description`| TEXT         | DEFAULT ''                                                     |
| `status`     | VARCHAR(20)  | NOT NULL, DEFAULT 'todo', CHECK IN (todo, in_progress, done)   |
| `priority`   | VARCHAR(10)  | NOT NULL, DEFAULT 'medium', CHECK IN (low, medium, high)       |
| `due_date`   | DATE         | NULL                                                           |
| `owner_id`   | INTEGER      | FK → users.id, NOT NULL, ON DELETE CASCADE                     |
| `created_at` | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP                            |
| `updated_at` | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP                            |

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'done')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

**Design decisions:**
- `owner_id` covers the `assigned_to` requirement. For this SaaS scope, each user owns their tasks. If multi-user assignment is needed later, add a separate `task_assignments` join table. No speculative schema now.
- Indexes on `owner_id`, `status`, and `due_date` cover the three main query patterns: filter by user, filter by status, find overdue.

---

## 3. API Endpoints

All endpoints prefixed with `/api`. JWT token sent as `Authorization: Bearer <token>`.

### Authentication — `/api/auth`

| Method | Path                  | Description                          | Auth |
|--------|-----------------------|--------------------------------------|------|
| POST   | `/api/auth/register`  | Create account, return JWT           | No   |
| POST   | `/api/auth/login`     | Verify credentials, return JWT       | No   |

**Register request:** `{ email, password, full_name }`
**Login request:** `{ email, password }`
**Auth response:** `{ access_token: string, token_type: "bearer" }`

### Tasks — `/api/tasks`

| Method | Path              | Description                                                        | Auth |
|--------|-------------------|--------------------------------------------------------------------|------|
| GET    | `/api/tasks`      | List current user's tasks. Query: `status`, `priority`, `sort`, `page`, `limit` | Yes |
| POST   | `/api/tasks`      | Create a new task for current user                                 | Yes  |
| GET    | `/api/tasks/{id}` | Get single task (must belong to current user)                      | Yes  |
| PUT    | `/api/tasks/{id}` | Update task (must belong to current user)                          | Yes  |
| DELETE | `/api/tasks/{id}` | Delete task (must belong to current user)                          | Yes  |

**Query params for GET /api/tasks:**
- `status` — filter: `todo`, `in_progress`, `done`
- `priority` — filter: `low`, `medium`, `high`
- `sort` — field: `created_at`, `due_date`, `priority`. Prefix `-` for descending
- `page` — page number, default 1
- `limit` — items per page, default 20, max 100

### Dashboard — `/api/dashboard`

| Method | Path                    | Description                                | Auth |
|--------|-------------------------|--------------------------------------------|------|
| GET    | `/api/dashboard/stats`  | Aggregate task statistics for current user | Yes  |

**Response shape:**
```json
{
  "total": 42,
  "by_status": { "todo": 15, "in_progress": 10, "done": 17 },
  "by_priority": { "high": 8, "medium": 20, "low": 14 },
  "overdue": 3,
  "completed_this_week": 5
}
```

### User — `/api/users`

| Method | Path            | Description              | Auth |
|--------|-----------------|--------------------------|------|
| GET    | `/api/users/me` | Get current user profile | Yes  |

---

## 4. Frontend Page / Route Structure

All routes under `src/app/` using Next.js App Router.

| Route          | Page           | User Story                                            |
|----------------|----------------|-------------------------------------------------------|
| `/`            | Root redirect  | Authenticated → `/dashboard`, else → `/login`         |
| `/login`       | Login          | User enters email + password to get JWT               |
| `/register`    | Register       | User creates account with name, email, password       |
| `/dashboard`   | Dashboard      | User sees task statistics, overdue count, breakdowns  |
| `/tasks`       | Task list      | User sees paginated task list with status filters     |
| `/tasks/new`   | Create task    | User fills form to create a new task                  |
| `/tasks/[id]`  | Task detail    | User views/edits a single task, changes status        |

**Auth flow (client-side):**
- JWT stored in `localStorage`
- `middleware.ts` checks auth on protected routes, redirects to `/login` if missing
- `lib/api.ts` attaches Bearer token to every request
- On 401 response: clear token, redirect to `/login`

---

## 5. Data Models

### Backend — Pydantic Schemas

```python
# schemas/auth.py
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str  # min 8 chars validated in router
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

```python
# schemas/user.py
from datetime import datetime
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

```python
# schemas/task.py
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="", max_length=5000)
    status: TaskStatus = Field(default=TaskStatus.TODO)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: Optional[date] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[date]
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    limit: int
```

```python
# schemas/dashboard.py
from pydantic import BaseModel

class DashboardStats(BaseModel):
    total: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    overdue: int
    completed_this_week: int
```

### Frontend — TypeScript Interfaces

```typescript
// lib/types.ts

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  overdue: number;
  completed_this_week: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
}
```

---

## 6. Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./data/taskflow.db
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION_HOURS=24
      - CORS_ORIGINS=http://localhost:3000
    volumes:
      - backend-data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend-data:
```

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

### .env.example

```env
JWT_SECRET=change-me-to-a-random-64-char-string
JWT_EXPIRATION_HOURS=24
```

---

## 7. Error Handling

All errors return consistent JSON:

```json
{ "detail": "Human-readable message" }
```

| HTTP Code | When                                     |
|-----------|------------------------------------------|
| 400       | Validation error, malformed request      |
| 401       | Missing or invalid JWT                   |
| 403       | Token expired                            |
| 404       | Task not found / belongs to another user |
| 409       | Email already registered                 |
| 500       | Unexpected server error                  |

---

## 8. Security Model

- **Passwords:** bcrypt via `passlib[bcrypt]`, automatic salt
- **JWT:** HS256, 24h expiry, subject = user ID
- **CORS:** Restricted to frontend origin
- **Auth middleware:** Every `/api/tasks/*`, `/api/dashboard/*`, `/api/users/me` validates JWT
- **Row-level security:** All task queries filter by `owner_id = current_user.id`. No cross-user data access possible
- **Input validation:** Pydantic on all request bodies. SQLAlchemy ORM prevents SQL injection

---

## 9. Test Strategy

| Layer       | Tool           | Scope                                             |
|-------------|----------------|---------------------------------------------------|
| Unit        | pytest         | Auth logic, task CRUD, dashboard aggregation      |
| Integration | pytest + httpx | All 9 API endpoints with in-memory SQLite         |
| Frontend    | Vitest         | API client, hooks, form validation                |
| E2E         | Playwright     | Login → create task → dashboard → edit → delete   |

Backend tests use `sqlite:///file::memory:?cache=shared` with fresh schema per test.

---

## 10. User Story → Endpoint → Page Mapping

Every endpoint and page traces to a real user story. Nothing speculative.

| #  | User Story                                   | Endpoint(s)               | Page         |
|----|----------------------------------------------|---------------------------|--------------|
| 1  | Create an account                            | POST /api/auth/register   | /register    |
| 2  | Log in                                       | POST /api/auth/login      | /login       |
| 3  | Create a task                                | POST /api/tasks           | /tasks/new   |
| 4  | See all my tasks                             | GET /api/tasks            | /tasks       |
| 5  | Filter tasks by status/priority              | GET /api/tasks?status=    | /tasks       |
| 6  | View a single task                           | GET /api/tasks/{id}       | /tasks/[id]  |
| 7  | Edit a task                                  | PUT /api/tasks/{id}       | /tasks/[id]  |
| 8  | Delete a task                                | DELETE /api/tasks/{id}    | /tasks/[id]  |
| 9  | See task statistics                          | GET /api/dashboard/stats  | /dashboard   |
| 10 | See only my own tasks (no cross-user access) | All task endpoints filter by owner_id | —  |
