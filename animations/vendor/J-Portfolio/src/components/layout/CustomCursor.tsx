import { useEffect, useRef, useState } from 'react';
import TargetCursor from '@/components/react-bits/TargetCursor';

export const CustomCursor = () => {
  const [keyHovered, setKeyHovered] = useState(false);
  const wave = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let animation: Animation | undefined;
    const burst = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number; charge: number; color: string }>)
        .detail;
      const node = wave.current;
      if (!node) return;
      animation?.cancel();
      Object.assign(node.style, {
        left: `${detail.x}px`,
        top: `${detail.y}px`,
        borderColor: detail.color,
      });
      animation = node.animate(
        [
          { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0.9 },
          { transform: `translate(-50%, -50%) scale(${3 + detail.charge * 4})`, opacity: 0 },
        ],
        { duration: 500 + detail.charge * 250, easing: 'cubic-bezier(.16,1,.3,1)' }
      );
    };
    window.addEventListener('hero-particle-burst', burst);
    return () => {
      animation?.cancel();
      window.removeEventListener('hero-particle-burst', burst);
    };
  }, []);
  useEffect(() => {
    let x = -1;
    let y = -1;
    const sync = () => {
      const node = document.elementFromPoint(x, y);
      const active =
        document.body.dataset.secretWordHover === 'true' ||
        Boolean(node?.closest('[data-key-cursor="true"]'));
      document.body.classList.toggle('key-hover', active);
      setKeyHovered(active);
    };
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      sync();
    };
    const reset = () => {
      document.body.classList.remove('key-hover');
      setKeyHovered(false);
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-key-cursor', 'data-secret-word-hover'],
    });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', sync, { passive: true, capture: true });
    window.addEventListener('blur', reset);
    document.documentElement.addEventListener('pointerleave', reset);
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', sync, { capture: true });
      window.removeEventListener('blur', reset);
      document.documentElement.removeEventListener('pointerleave', reset);
      reset();
    };
  }, []);
  return (
    <>
      <div ref={wave} className="cursor-release-wave" aria-hidden="true" />
      <TargetCursor
        idleRing
        spinDuration={0}
        targetSelector={
          'a, button:not(:disabled), input, textarea, summary, [role="button"], [data-key-cursor="true"]'
        }
        cursorColorOnTarget="var(--theme-accent)"
        showLabel={false}
        blendMode="normal"
        size={keyHovered ? 72 : 40}
        padding={keyHovered ? 12 : 6}
        cornerSize={keyHovered ? 14 : 9}
        thickness={1.5}
        hoverDuration={0.25}
      />
    </>
  );
};
