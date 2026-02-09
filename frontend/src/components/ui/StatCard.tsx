"use client";

const accentMap: Record<string, string> = {
  citizen: "text-citizen-700 border-citizen-200",
  green: "text-green-700 border-green-200",
  yellow: "text-yellow-700 border-yellow-200",
  red: "text-red-700 border-red-200",
  blue: "text-blue-700 border-blue-200",
  purple: "text-purple-700 border-purple-200",
  orange: "text-orange-700 border-orange-200",
};

const iconBgMap: Record<string, string> = {
  citizen: "bg-citizen-50 text-citizen-600",
  green: "bg-green-50 text-green-600",
  yellow: "bg-yellow-50 text-yellow-600",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: string;
  icon?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  accent = "citizen",
  icon,
}: StatCardProps) {
  const colors = accentMap[accent] || accentMap.citizen;
  const iconBg = iconBgMap[accent] || iconBgMap.citizen;

  return (
    <div className={`card border-l-4 ${colors.split(" ")[1] || "border-citizen-200"}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className={`text-xl w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 ${colors.split(" ")[0]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
