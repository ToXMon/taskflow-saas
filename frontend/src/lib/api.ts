import { getToken, removeToken } from "./auth";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskListResponse,
  TaskFilters,
  DashboardStats,
} from "./types";

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Empty baseUrl — API route proxy forwards /api/* to backend
    // For local dev without proxy, set NEXT_PUBLIC_API_URL
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  }

  private headers(): HeadersInit {
    const h: HeadersInit = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) {
      h["Authorization"] = `Bearer ${token}`;
    }
    return h;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  private buildQuery(params: Record<string, string | number | undefined>): string {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return qs ? `?${qs}` : "";
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("POST", "/api/auth/register", data);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("POST", "/api/auth/login", data);
  }

  async getMe(): Promise<User> {
    return this.request<User>("GET", "/api/users/me");
  }

  async getTasks(filters?: TaskFilters): Promise<TaskListResponse> {
    const q = this.buildQuery({
      status: filters?.status,
      priority: filters?.priority,
      sort: filters?.sort,
      page: filters?.page,
      limit: filters?.limit,
    });
    return this.request<TaskListResponse>("GET", `/api/tasks${q}`);
  }

  async createTask(data: TaskCreateInput): Promise<Task> {
    return this.request<Task>("POST", "/api/tasks", data);
  }

  async getTask(id: number): Promise<Task> {
    return this.request<Task>("GET", `/api/tasks/${id}`);
  }

  async updateTask(id: number, data: TaskUpdateInput): Promise<Task> {
    return this.request<Task>("PUT", `/api/tasks/${id}`, data);
  }

  async deleteTask(id: number): Promise<void> {
    await this.request<void>("DELETE", `/api/tasks/${id}`);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>("GET", "/api/dashboard/stats");
  }
}

export const api = new ApiClient();
