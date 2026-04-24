"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useTasks } from "@/hooks/use-tasks";
import TaskList from "@/components/tasks/task-list";
import TaskFiltersBar from "@/components/tasks/task-filters";
import Button from "@/components/ui/button";

export default function TasksPage() {
  const router = useRouter();
  const {
    tasks,
    total,
    page,
    limit,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    deleteTask,
  } = useTasks({ page: 1, limit: 20 });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  const totalPages = Math.ceil(total / limit);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link href="/tasks/new">
          <Button size="sm">+ New Task</Button>
        </Link>
      </div>

      <TaskFiltersBar filters={filters} onChange={updateFilters} />

      <TaskList tasks={tasks} loading={loading} error={error} onDelete={handleDelete} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => changePage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
