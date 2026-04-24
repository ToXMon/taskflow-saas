"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Task, TaskCreateInput } from "@/lib/types";
import TaskForm from "@/components/tasks/task-form";
import Loading from "@/components/ui/loading";
import Button from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = Number(params.id);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    loadTask();
  }, [router]);

  const loadTask = async () => {
    try {
      const t = await api.getTask(taskId);
      setTask(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: TaskCreateInput) => {
    const updated = await api.updateTask(taskId, data);
    setTask(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await api.deleteTask(taskId);
      router.push("/tasks");
    }
  };

  if (loading) return <Loading text="Loading task..." />;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  if (!task) return null;

  const dueDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString()
    : "No due date";

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Task</h1>
        <TaskForm
          task={task}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
          <p className="mt-2 text-gray-600 whitespace-pre-wrap">{task.description || "No description"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <StatusBadge status={task.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Priority:</span>
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-gray-500 pt-3 border-t border-gray-100">
          <div>
            <span className="font-medium">Due:</span> {dueDate}
          </div>
          <div>
            <span className="font-medium">Created:</span>{" "}
            {new Date(task.created_at).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{" "}
            {new Date(task.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={() => router.push("/tasks")}>
          &larr; Back to Tasks
        </Button>
      </div>
    </div>
  );
}
