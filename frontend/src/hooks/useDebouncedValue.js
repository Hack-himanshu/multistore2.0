import { useEffect, useState } from 'react';

// Returns a debounced copy of `value` that only updates `delay`ms after the
// last change — e.g. for search inputs, so typing doesn't fire an API call
// on every single keystroke.
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
