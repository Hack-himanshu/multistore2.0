import { forwardRef } from 'react';
import clsx from 'clsx';

const variants = {
  primary: 'bg-gray-900 hover:bg-gray-800 text-white shadow-[0_10px_30px_rgba(17,24,39,0.16)]',
  gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-[0_16px_40px_rgba(99,102,241,0.25)]',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm',
  outline: 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-transparent shadow-sm',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-[0_10px_30px_rgba(220,38,38,0.18)]',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_10px_30px_rgba(16,185,129,0.18)]',
};

const sizes = {
  xs: 'px-3 py-1.5 text-xs rounded-lg',
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-2xl',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
