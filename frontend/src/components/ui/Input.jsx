import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  type = 'text',
  className,
  containerClassName,
  required,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={clsx(
            'w-full px-4 py-3 rounded-2xl border text-gray-900 placeholder-gray-400 text-sm shadow-sm',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            (isPassword || rightElement) && 'pr-12',
            error
              ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400'
              : 'border-gray-200 bg-white focus:ring-gray-900/10 focus:border-gray-400',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
        {rightElement && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
