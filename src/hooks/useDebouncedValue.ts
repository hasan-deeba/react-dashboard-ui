/**
 * Debounced mirror of a value.
 *
 * PURPOSE : keep fast-changing state (search input) from hammering effects
 *           downstream (API calls, heavy computation).
 * EXPORTS : useDebouncedValue(value, delay?).
 * EDIT    : pure timing helper — no fetching, no data logic here.
 */

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
