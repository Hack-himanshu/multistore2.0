import clsx from 'clsx';

export default function Spinner({ size = 'md', className }) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={clsx(
        'rounded-full border-gray-200 border-t-indigo-600 animate-spin',
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🏪</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Loading MultiStore...</p>
      </div>
    </div>
  );
}
