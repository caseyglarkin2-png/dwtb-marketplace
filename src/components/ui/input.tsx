export function Input({
  label,
  error,
  required,
  prefix,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  prefix?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">
            {prefix}
          </span>
        )}
        <input
          className={`w-full bg-surface-raised border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${
            prefix ? "pl-8" : ""
          } ${error ? "border-danger" : "border-border"}`}
          {...props}
        />
      </div>
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
}
