import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-cream border-2 border-brand hover:-translate-y-0.5 hover:shadow-lg shadow-brand/30',
  secondary: 'bg-cream text-black border-2 border-brand hover:bg-brand hover:text-cream',
  danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
};

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-black uppercase tracking-widest text-xs
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 min-h-[44px]
        ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
