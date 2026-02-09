const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Passed: "bg-blue-100 text-blue-800",
  Rejected: "bg-red-100 text-red-800",
  Expired: "bg-gray-100 text-gray-500",
  Executed: "bg-purple-100 text-purple-800",
  Cancelled: "bg-gray-100 text-gray-600",
  Timelocked: "bg-yellow-100 text-yellow-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Completed: "bg-blue-100 text-blue-800",
  // Grants
  "MilestoneCompleted": "bg-teal-100 text-teal-800",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const color = statusColors[status] || "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}
    >
      {status}
    </span>
  );
}
