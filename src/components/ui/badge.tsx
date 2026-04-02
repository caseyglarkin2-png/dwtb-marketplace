export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "danger" | "warning";
  className?: string;
}) {
  const variants = {
    default: "border-border text-text-secondary",
    accent: "border-accent/30 bg-accent/5 text-accent",
    danger: "border-danger/30 bg-danger/5 text-danger",
    warning: "border-warning/30 bg-warning/5 text-warning",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
