// ============================================
// MAGNETIC EFFECT - Awwwards Style
// Elements follow cursor with smooth GSAP animation
// ============================================

import gsap from 'gsap';

export const initMagneticEffect = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const magneticElements = document.querySelectorAll('.magnetic');
  const controller = new AbortController();

  magneticElements.forEach((element) => {
    const el = element as HTMLElement;

    el.addEventListener(
      'mouseenter',
      () => {
        gsap.to(el, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out',
        });
      },
      { signal: controller.signal }
    );

    el.addEventListener(
      'mouseleave',
      () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)',
        });
      },
      { signal: controller.signal }
    );

    el.addEventListener(
      'mousemove',
      (e: MouseEvent) => {
        const { left, top, width, height } = el.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Magnetic strength (max distance to pull)
        const strength = 0.3;

        gsap.to(el, {
          x: deltaX * strength,
          y: deltaY * strength,
          duration: 0.3,
          ease: 'power2.out',
        });
      },
      { signal: controller.signal }
    );
  });
  return () => {
    controller.abort();
    magneticElements.forEach((element) => {
      gsap.killTweensOf(element);
      gsap.set(element, { clearProps: 'transform' });
    });
  };
};
