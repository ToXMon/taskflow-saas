"use client";

import type { TaskStatus, TaskPriority, TaskFilters } from "@/lib/types";
import Select from "@/components/ui/select";

interface TaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const sortOptions = [
  { value: "-created_at", label: "Newest First" },
  { value: "created_at", label: "Oldest First" },
  { value: "due_date", label: "Due Date (Earliest)" },
  { value: "title", label: "Title (A-Z)" },
];

export default function TaskFiltersBar({ filters, onChange }: TaskFiltersProps) {
  const handleChange = (key: string, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="w-36">
        <Select
          label="Status"
          options={statusOptions}
          placeholder="All"
          value={filters.status || ""}
          onChange={(e) => handleChange("status", e.target.value)}
        />
      </div>
      <div className="w-36">
        <Select
          label="Priority"
          options={priorityOptions}
          placeholder="All"
          value={filters.priority || ""}
          onChange={(e) => handleChange("priority", e.target.value)}
        />
      </div>
      <div className="w-44">
        <Select
          label="Sort"
          options={sortOptions}
          value={filters.sort || "-created_at"}
          onChange={(e) => handleChange("sort", e.target.value)}
        />
      </div>
    </div>
  );
}
