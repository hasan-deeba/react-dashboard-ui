import { useEffect, useState } from "react";

/** Animates a number from 0 to `target` with a cubic ease-out. */
export function useCountUp(target: number, duration = 1500, delay = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    let startTime: number | null = null;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const timeout = window.setTimeout(() => {
      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
        setValue(target * easeOutCubic(progress));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}
