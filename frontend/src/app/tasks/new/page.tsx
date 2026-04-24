"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useTasks } from "@/hooks/use-tasks";
import TaskForm from "@/components/tasks/task-form";
import type { TaskCreateInput } from "@/lib/types";

export default function NewTaskPage() {
  const router = useRouter();
  const { createTask } = useTasks();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  const handleSubmit = async (data: TaskCreateInput) => {
    await createTask(data);
    router.push("/tasks");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Task</h1>
      <TaskForm onSubmit={handleSubmit} onCancel={() => router.push("/tasks")} />
    </div>
  );
}
