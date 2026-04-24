"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Task, TaskListResponse, TaskCreateInput, TaskUpdateInput, TaskFilters } from "@/lib/types";

export function useTasks(initialFilters?: TaskFilters) {
  const [data, setData] = useState<TaskListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});

  const fetchTasks = useCallback(async (f?: TaskFilters) => {
    const query = f ?? filters;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTasks(query);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateFilters = (newFilters: TaskFilters) => {
    const merged = { ...newFilters, page: 1 };
    setFilters(merged);
    fetchTasks(merged);
  };

  const changePage = (page: number) => {
    const merged = { ...filters, page };
    setFilters(merged);
    fetchTasks(merged);
  };

  const createTask = async (input: TaskCreateInput): Promise<Task> => {
    const task = await api.createTask(input);
    fetchTasks();
    return task;
  };

  const updateTask = async (id: number, input: TaskUpdateInput): Promise<Task> => {
    const task = await api.updateTask(id, input);
    fetchTasks();
    return task;
  };

  const deleteTask = async (id: number) => {
    await api.deleteTask(id);
    fetchTasks();
  };

  return {
    tasks: data?.tasks ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    loading,
    error,
    filters,
    fetchTasks,
    updateFilters,
    changePage,
    createTask,
    updateTask,
    deleteTask,
  };
}
