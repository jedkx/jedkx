import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks';
import '@/styles/reference-ribbon.css';
const ScrollVelocity = lazy(() => import('@/components/react-bits/ScrollVelocity'));

interface ReferenceItem {
  text: string;
  reference?: string;
  href?: string;
  title?: string;
  color?: string;
  gradient?: string;
  textShadow?: string;
  font?: string;
  fontWeight?: string;
  letterSpacing?: string;
  fontSize?: string;
}
interface MarqueeProps {
  items: Array<string | ReferenceItem>;
  reverse?: boolean;
  className?: string;
}
export const Marquee: React.FC<MarqueeProps> = ({ items, reverse = false, className }) => {
  const root = useRef<HTMLDivElement>(null);
  const [fontReady, setFontReady] = useState(false);
  const [near, setNear] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (live) setFontReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (reduced || !root.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.target.classList.toggle('is-arriving', entry.isIntersecting)
        );
      },
      { root: root.current, threshold: 0.8 }
    );
    root.current
      .querySelectorAll('[data-reference="hacker"]')
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items, reduced, near]);

  const quotes = (
    <div className="reference-group" key="quotes">
      {items.map((raw, index) => {
        const item: ReferenceItem = typeof raw === 'string' ? { text: raw } : raw;
        const style: React.CSSProperties = {
          color: item.color,
          fontFamily: item.font,
          fontWeight: item.fontWeight,
          letterSpacing: item.letterSpacing,
          fontSize: item.fontSize,
          textShadow: item.textShadow,
        };
        return (
          <span
            className="reference-item"
            data-reference={item.reference}
            key={index}
            style={style}
          >
            <span className="reference-quote">{item.text}</span>
          </span>
        );
      })}
    </div>
  );
  return (
    <div ref={root} className={cn('reference-ribbon', reverse && 'reference-reverse', className)}>
      {near && !reduced ? (
        <Suspense fallback={quotes}>
          <ScrollVelocity
            velocity={!fontReady ? 0 : reverse ? 38 : -38}
            texts={[quotes]}
            numCopies={3}
            parallaxClassName="reference-velocity"
            scrollerClassName="reference-velocity-track"
            className="reference-velocity-copy"
            pauseOnHover={false}
            draggable={false}
            skewWithVelocity={1.5}
            velocityMapping={{ input: [0, 1000], output: [0, 2] }}
          />
        </Suspense>
      ) : (
        quotes
      )}
    </div>
  );
};
