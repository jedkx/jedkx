import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ParticleBackground } from '@/components/layout/ParticleBackground';
import { usePrefersReducedMotion } from '@/hooks';

export const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('.masthead-title > span', {
        yPercent: 105,
        rotate: 3,
        duration: 1.15,
        stagger: 0.12,
        ease: 'power4.out',
      });
      gsap.from('.hero-reveal', {
        y: 18,
        opacity: 0,
        duration: 0.8,
        stagger: 0.07,
        delay: 0.35,
        ease: 'power3.out',
      });
      const scene = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      scene.to('.hero-bottom', { opacity: 0, y: -30, duration: 0.2 }, 0);
      scene.to(
        '.masthead',
        {
          scale: 0.34,
          opacity: 0,
          filter: 'blur(8px)',
          transformOrigin: '50% 50%',
          duration: 0.55,
          ease: 'power2.inOut',
        },
        0
      );
      scene.fromTo(
        '.hero-portal',
        { clipPath: 'inset(48% 40% 48% 40%)', opacity: 0, scale: 0.82 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: 'power2.inOut',
        },
        0.15
      );
      scene.fromTo(
        '.portal-statement > span',
        { yPercent: 110 },
        { yPercent: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out' },
        0.45
      );
      scene.to('.hero-portal', { scale: 0.94, duration: 0.25 }, 0.85);
    }, sectionRef);
    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} id="hero" className="signal-hero">
      <div className="hero-stage">
        <ParticleBackground />
        <div className="masthead">
          <div className="masthead-kicker hero-reveal micro-label">
            <span>FULL-STACK DEVELOPER</span>
          </div>
          <h1 aria-label="Caner Coşkun">
            <span className="masthead-title">
              <span>CANER</span>
            </span>
            <span className="masthead-title masthead-surname">
              <span>
                COŞKUN
                <span className="name-period" aria-hidden="true">
                  .
                </span>
              </span>
            </span>
          </h1>
        </div>
        <div className="hero-portal" aria-hidden="true">
          <div className="portal-bar micro-label">
            <span className="accent">jedkx@universe:~</span>
            <span>whoami ↵</span>
          </div>
          <div className="portal-statement">
            <span>BUILT FROM</span>
            <span>
              CURIOSITY<span className="accent">.</span>
            </span>
          </div>
          <div className="portal-bottom">
            <span>
              Logic is the foundation.
              <br />
              Instinct is the difference.
            </span>
            <span className="micro-label">SCROLL TO EXPLORE ↓</span>
          </div>
        </div>
        <div className="hero-bottom hero-reveal">
          <div className="hero-intro">
            <span className="micro-label accent">HELLO, FRIEND_</span>
            <p>
              I build systems.
              <br />I chase the <em>unexpected.</em>
            </p>
          </div>
          <a href="#projects" className="signal-link hero-work-link hoverable">
            <span>EXPLORE PROJECTS</span>
            <ArrowDownRight size={25} />
          </a>
          <a href="#cv" className="hero-cv-link hoverable">
            VIEW CV <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};
