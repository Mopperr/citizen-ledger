interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 border-4 border-citizen-200 rounded-full" />
        <div className="absolute top-0 left-0 w-10 h-10 border-4 border-citizen-600 rounded-full border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({ lines = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-16">
      <span className="text-4xl block mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-6">
          {action.label}
        </button>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          {icon && <span className="text-3xl">{icon}</span>}
          {title}
        </h1>
        {description && (
          <p className="text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

interface CategoryTagProps {
  category: string;
  size?: "sm" | "md";
}

const categoryColors: Record<string, string> = {
  infrastructure: "bg-blue-100 text-blue-800",
  education: "bg-purple-100 text-purple-800",
  healthcare: "bg-green-100 text-green-800",
  research: "bg-yellow-100 text-yellow-800",
  emergency: "bg-red-100 text-red-800",
  node_incentives: "bg-orange-100 text-orange-800",
  custom: "bg-gray-100 text-gray-700",
};

export function CategoryTag({ category, size = "sm" }: CategoryTagProps) {
  const color = categoryColors[category.toLowerCase()] || categoryColors.custom;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium capitalize ${color} ${sizeClass}`}>
      {category.replace(/_/g, " ")}
    </span>
  );
}
