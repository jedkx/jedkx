// ============================================
// SKILL BAR COMPONENT - Animated Progress
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface SkillBarProps {
  name: string;
  level: number;
  delay?: number;
  className?: string;
  animate?: boolean;
}

export const SkillBar: React.FC<SkillBarProps> = ({
  name,
  level,
  delay = 0,
  className,
  animate = true,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!animate || !barRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(barRef.current);

    return () => observer.disconnect();
  }, [animate]);

  useEffect(() => {
    if (!isVisible || !barRef.current) return;

    gsap.fromTo(
      barRef.current,
      { width: '0%' },
      {
        width: `${level}%`,
        duration: 1.2,
        delay: delay * 0.1,
        ease: 'power3.out',
      }
    );
  }, [isVisible, level, delay]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm text-text tracking-wide">{name}</span>
        <span className="font-mono text-xs text-primary">{level}%</span>
      </div>
      
      <div className="relative h-2 bg-surface-light rounded-full overflow-hidden">
        {/* Animated fill */}
        <div
          ref={barRef}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-secondary rounded-full"
          style={{ width: animate ? '0%' : `${level}%` }}
        />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        
        {/* Grid lines */}
        <div className="absolute inset-0 flex">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex-1 border-r border-background/30 last:border-r-0" />
          ))}
        </div>
      </div>
    </div>
  );
};
