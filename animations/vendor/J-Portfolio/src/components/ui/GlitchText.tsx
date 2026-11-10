// ============================================
// GLITCH TEXT COMPONENT - Cyberpunk Text Effect
// ============================================

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';
import { secureChance } from '@/lib/random';

interface GlitchTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
  className?: string;
  glitchOnHover?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  as: Component = 'span',
  className,
  glitchOnHover = false,
  intensity = 'medium',
}) => {
  const textRef = useRef<HTMLElement>(null);

  const glitchIntensity = {
    low: { x: 2, duration: 0.05 },
    medium: { x: 4, duration: 0.03 },
    high: { x: 8, duration: 0.02 },
  };

  const triggerGlitch = () => {
    if (!textRef.current) return;

    const { x, duration } = glitchIntensity[intensity];

    const tl = gsap.timeline();
    
    tl.to(textRef.current, {
      x: -x,
      duration,
      ease: 'steps(1)',
    })
      .to(textRef.current, {
        x: x,
        duration,
        ease: 'steps(1)',
      })
      .to(textRef.current, {
        x: -x / 2,
        duration,
        ease: 'steps(1)',
      })
      .to(textRef.current, {
        x: 0,
        duration,
        ease: 'steps(1)',
      });
  };

  useEffect(() => {
    if (glitchOnHover) return;

    // Random glitch effect
    const interval = setInterval(() => {
      if (secureChance(0.05)) {
        triggerGlitch();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [glitchOnHover]);

  return (
    <Component
      ref={textRef as React.RefObject<HTMLHeadingElement & HTMLSpanElement & HTMLParagraphElement>}
      className={cn('relative inline-block', className)}
      onMouseEnter={glitchOnHover ? triggerGlitch : undefined}
      data-text={text}
    >
      {/* Before pseudo-element effect via CSS */}
      <span className="relative z-10">{text}</span>
      
      {/* Glitch layers */}
      <span
        className="absolute left-0 top-0 -z-10 text-secondary opacity-80"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span
        className="absolute left-0 top-0 -z-10 text-accent opacity-80"
        style={{ clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)' }}
        aria-hidden="true"
      >
        {text}
      </span>
    </Component>
  );
};
