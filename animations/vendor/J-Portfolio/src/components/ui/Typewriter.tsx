// ============================================
// TYPEWRITER COMPONENT - Animated Text
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks';

interface TypewriterProps {
  texts: string[];
  speed?: number;
  pauseTime?: number;
  loop?: boolean;
  className?: string;
  cursorClassName?: string;
  prefix?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  texts,
  speed = 50,
  pauseTime = 2000,
  loop = true,
  className,
  cursorClassName,
  prefix = '',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Cursor blink effect
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(texts[0] ?? '');
      setShowCursor(false);
      return;
    }

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, [prefersReducedMotion, texts]);

  const handleTyping = useCallback(() => {
    const currentText = texts[textIndex];

    if (isTyping) {
      if (displayText.length < currentText.length) {
        setDisplayText(currentText.slice(0, displayText.length + 1));
      } else {
        // Finished typing, wait then start deleting
        setTimeout(() => setIsTyping(false), pauseTime);
      }
    } else {
      if (displayText.length > 0) {
        setDisplayText(displayText.slice(0, -1));
      } else {
        // Finished deleting, move to next text
        setIsTyping(true);
        if (loop) {
          setTextIndex((prev) => (prev + 1) % texts.length);
        } else if (textIndex < texts.length - 1) {
          setTextIndex((prev) => prev + 1);
        }
      }
    }
  }, [displayText, isTyping, textIndex, texts, pauseTime, loop]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const typingSpeed = isTyping ? speed : speed / 2;
    const timeout = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timeout);
  }, [handleTyping, isTyping, speed, prefersReducedMotion]);

  return (
    <span className={cn('inline-flex items-center font-mono', className)}>
      {prefix && <span className="text-primary mr-2">{prefix}</span>}
      <span className="text-text">{displayText}</span>
      <span
        className={cn(
          'ml-0.5 inline-block w-[2px] h-[1.2em] bg-primary transition-opacity duration-100',
          showCursor ? 'opacity-100' : 'opacity-0',
          cursorClassName
        )}
        aria-hidden="true"
      />
    </span>
  );
};
