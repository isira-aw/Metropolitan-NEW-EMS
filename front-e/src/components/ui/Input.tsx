import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  optional?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, optional, required, id, className = '', ...rest }, ref) => {
    const inputId = id ?? rest.name;

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1"
          >
            {label} {optional && <span className="text-slate-300 normal-case">(optional)</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className={`w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border outline-none transition-all
            ${error
              ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
              : 'border-transparent focus:ring-2 focus:ring-corporate-blue/20'}
            ${className}`}
          {...rest}
        />
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="mt-1 text-xs font-bold text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
