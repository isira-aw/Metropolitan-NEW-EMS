import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-corporate-blue text-white hover:bg-slate-900 shadow-lg',
  secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
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
        transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]
        ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
