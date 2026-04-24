"use client";

import type { DashboardStats } from "@/lib/types";

interface PriorityChartProps {
  stats: DashboardStats;
}

const priorityConfig = [
  { key: "high" as const, label: "High", bg: "bg-red-400", text: "text-red-700" },
  { key: "medium" as const, label: "Medium", bg: "bg-orange-400", text: "text-orange-700" },
  { key: "low" as const, label: "Low", bg: "bg-gray-400", text: "text-gray-700" },
];

export default function PriorityChart({ stats }: PriorityChartProps) {
  const total = stats.total || 1;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Priority</h3>
      {stats.total === 0 ? (
        <p className="text-sm text-gray-400">No tasks yet</p>
      ) : (
        <div className="space-y-3">
          {priorityConfig.map(({ key, label, bg, text }) => {
            const count = stats.by_priority[key] || 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-600">{label}</span>
                  <span className={text}>{count} ({pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${bg} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
