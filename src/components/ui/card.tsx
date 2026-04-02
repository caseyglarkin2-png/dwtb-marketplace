export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface-raised border border-border rounded-lg p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
