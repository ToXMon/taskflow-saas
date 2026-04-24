"use client";

interface StatsCardProps {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ label, value, color = "blue", icon }: StatsCardProps) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-50 text-gray-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={`flex items-center justify-center h-12 w-12 rounded-full ${colorMap[color] || colorMap.blue}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
