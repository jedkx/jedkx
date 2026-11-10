// ============================================
// TERMINAL COMPONENT - Boot Sequence Effect
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';
import type { TerminalLine } from '@/types';

interface TerminalProps {
  lines: TerminalLine[];
  title?: string;
  onComplete?: () => void;
  className?: string;
  autoStart?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  title = 'TERMINAL',
  onComplete,
  className,
  autoStart = true,
}) => {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoStart) return;

    lines.forEach((line, index) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, index]);

        // Animate the line appearing
        if (terminalRef.current) {
          const lineElement = terminalRef.current.querySelector(
            `[data-line="${index}"]`
          );
          if (lineElement) {
            gsap.fromTo(
              lineElement,
              { opacity: 0, x: -10 },
              { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
            );
          }
        }

        // Call onComplete after last line
        if (index === lines.length - 1 && onComplete) {
          setTimeout(onComplete, 500);
        }
      }, line.delay);
    });
  }, [lines, autoStart, onComplete]);

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'success':
        return 'text-primary';
      case 'error':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-text-muted';
    }
  };

  return (
    <div
      ref={terminalRef}
      className={cn(
        'bg-surface/80 backdrop-blur-sm border border-border rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-border">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-error/80" />
          <span className="w-3 h-3 rounded-full bg-warning/80" />
          <span className="w-3 h-3 rounded-full bg-primary/80" />
        </div>
        <span className="ml-2 text-xs font-mono text-text-muted tracking-wider">
          {title}
        </span>
      </div>

      {/* Terminal Body */}
      <div className="p-4 font-mono text-sm space-y-1 min-h-[200px]">
        {lines.map((line, index) => (
          <div
            key={index}
            data-line={index}
            className={cn(
              'opacity-0 transition-opacity',
              visibleLines.includes(index) && 'opacity-100',
              getLineColor(line.type)
            )}
          >
            {line.text}
          </div>
        ))}
        
        {/* Blinking cursor */}
        <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
      </div>
    </div>
  );
};
