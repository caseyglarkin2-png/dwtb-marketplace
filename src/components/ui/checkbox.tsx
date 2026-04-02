export function Checkbox({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="mt-1 w-5 h-5 rounded border-border bg-surface-raised text-accent focus:ring-accent/50 focus:ring-2 cursor-pointer accent-accent"
        {...props}
      />
      <span className="text-text-secondary text-sm leading-relaxed">
        {label}
      </span>
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </label>
  );
}
