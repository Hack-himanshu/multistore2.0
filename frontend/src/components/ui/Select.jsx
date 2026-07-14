import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select an option',
  className,
  containerClassName,
  required,
  ...props
}, ref) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={clsx(
            'w-full px-4 py-3 pr-10 rounded-2xl border text-gray-900 text-sm appearance-none shadow-sm',
            'focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400'
              : 'border-gray-200 bg-white focus:ring-gray-900/10 focus:border-gray-400',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-600">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
