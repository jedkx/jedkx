// ============================================
// TEXT REVEAL ANIMATION - Awwwards Style
// Character-by-character reveal with stagger
// ============================================

import gsap from 'gsap';

export const initTextReveal = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Split text into characters
  const splitText = (element: HTMLElement) => {
    if (element.dataset.revealProcessed === 'true') return;
    element.dataset.revealProcessed = 'true';

    const text = element.textContent || '';
    element.innerHTML = '';
    
    text.split('').forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      span.classList.add('char');
      element.appendChild(span);
    });
  };

  // Apply to all elements with .text-reveal class
  document.querySelectorAll('.text-reveal').forEach((el) => {
    const element = el as HTMLElement;
    splitText(element);

    const chars = element.querySelectorAll('.char');

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.03,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
};
