type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-rule bg-sheet text-ink hover:bg-paper",
  danger: "bg-out text-white hover:opacity-90",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 font-medium disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
