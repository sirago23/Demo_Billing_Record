import { ChevronDown } from "lucide-react";

/** One look for every text-like control: 48 px tall, rule border, accent focus ring from globals.css. */
export const CONTROL_CLASS =
  "block min-h-12 w-full rounded-control border border-rule bg-sheet px-3 text-base text-ink placeholder:text-muted";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input className={`mt-1 ${CONTROL_CLASS} ${className}`} {...props} />
    </label>
  );
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function SelectField({ label, className = "", children, ...props }: SelectFieldProps) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <span className="relative mt-1 block">
        <select className={`${CONTROL_CLASS} appearance-none pr-10 ${className}`} {...props}>
          {children}
        </select>
        <ChevronDown aria-hidden size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
      </span>
    </label>
  );
}
