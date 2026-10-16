type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input
        className={`mt-1 block min-h-12 w-full rounded-control border border-rule bg-sheet px-3 text-base text-ink ${className}`}
        {...props}
      />
    </label>
  );
}
