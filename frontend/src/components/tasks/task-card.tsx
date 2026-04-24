"use client";

import Link from "next/link";
import type { Task } from "@/lib/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";

interface TaskCardProps {
  task: Task;
  onDelete: (id: number) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const dueDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString()
    : null;

  const isOverdue =
    task.due_date &&
    task.status !== "done" &&
    new Date(task.due_date + "T00:00:00") < new Date();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/tasks/${task.id}`}
            className="text-base font-semibold text-gray-900 hover:text-blue-600 truncate block"
          >
            {task.title}
          </Link>
          {task.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDelete(task.id)}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {dueDate && (
          <span
            className={`text-xs ${
              isOverdue ? "text-red-600 font-medium" : "text-gray-500"
            }`}
          >
            Due: {dueDate}
          </span>
        )}
      </div>
    </div>
  );
}
