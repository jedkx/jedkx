import { useEffect, useRef, type RefObject } from 'react';

/** Subscribe to RAF only while the element is on screen and the tab is active. */
export function useVisibleAnimationFrame(
  element: RefObject<HTMLElement | null>,
  disabled: boolean,
  callback: (delta: number) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    const node = element.current;
    if (!node || disabled) return;
    let visible = false;
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      callbackRef.current(last ? Math.min(64, now - last) : 0);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(node);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [element, disabled]);
}
