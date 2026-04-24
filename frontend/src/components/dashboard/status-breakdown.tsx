"use client";

import type { DashboardStats } from "@/lib/types";

interface StatusBreakdownProps {
  stats: DashboardStats;
}

const statusConfig = [
  { key: "todo" as const, label: "To Do", bg: "bg-yellow-400", text: "text-yellow-700" },
  { key: "in_progress" as const, label: "In Progress", bg: "bg-blue-400", text: "text-blue-700" },
  { key: "done" as const, label: "Done", bg: "bg-green-400", text: "text-green-700" },
];

export default function StatusBreakdown({ stats }: StatusBreakdownProps) {
  const total = stats.total || 1;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Status</h3>
      {stats.total === 0 ? (
        <p className="text-sm text-gray-400">No tasks yet</p>
      ) : (
        <div className="space-y-3">
          {statusConfig.map(({ key, label, bg, text }) => {
            const count = stats.by_status[key] || 0;
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
