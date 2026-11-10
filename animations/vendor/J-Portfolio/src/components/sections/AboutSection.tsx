import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import { Marquee } from '@/components/ui/Marquee';
import { CV_DRIVE_FILE_ID } from '@/constants/config';
import {
  CONTACT_EMAIL,
  EDUCATION,
  EXPERIENCE,
  MANIFESTO_ITEMS,
  PERSONAL_INFO,
} from '@/constants/data';
import { usePrefersReducedMotion } from '@/hooks';

export const INFO_LINES = [
  { key: 'role', value: 'full-stack developer' },
  {
    key: 'org',
    value: `${EXPERIENCE[0].company.toLowerCase()} · ${EXPERIENCE[0].period.toLowerCase()}`,
  },
  { key: 'mission', value: 'enterprise apps · 200+ municipalities' },
  { key: 'langs', value: 'c# · typescript · python · c' },
  { key: 'backend', value: 'asp.net core 8 / ef core / mvc' },
  { key: 'tooling', value: 'devexpress · docker · sql server' },
  { key: 'degree', value: EDUCATION[0].degree.toLowerCase() },
  { key: 'school', value: `${EDUCATION[0].school.toLowerCase()} · ankara` },
  { key: 'grad', value: EDUCATION[0].note?.toLowerCase() ?? EDUCATION[0].period },
  { key: 'creative', value: 'video editing · 6+ years' },
  { key: 'hobby', value: 'gamedev (godot) · embedded (rpi)' },
  { key: 'interest', value: 'cybersecurity · ai/ml · open src' },
];

export const AboutSection: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const username = PERSONAL_INFO.name.toLowerCase().replace(/\s+/g, '');
  useEffect(() => {
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('.about-reveal', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-heading', start: 'top 85%', once: true },
      });
      gsap.fromTo(
        '.identity-terminal',
        { scale: 0.84, rotateX: 12, y: 80 },
        {
          scale: 1,
          rotateX: 0,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.about-workspace',
            start: 'top 95%',
            end: 'top 25%',
            scrub: 0.8,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [prefersReducedMotion]);
  return (
    <section ref={sectionRef} id="about" className="signal-about">
      <Marquee items={MANIFESTO_ITEMS} />
      <div className="editorial-shell">
        <div className="section-register micro-label">
          <span>ABOUT</span>
        </div>
        <div className="about-heading">
          <h2 className="editorial-heading about-reveal">
            ENGINEERING
            <br />
            MEETS <span className="outline-text">INSTINCT.</span>
          </h2>
          <div className="about-annotation about-reveal">
            <p>Enterprise systems by day. Games, films, hardware and rabbit holes after hours.</p>
            <span className="micro-label muted">ONE CODE TO RULE THEM ALL.</span>
          </div>
        </div>
        <div className="about-workspace">
          <div className="identity-terminal">
            <div className="terminal-titlebar">
              <span className="terminal-lights" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="micro-label">{username}@jedkx — zsh</span>
            </div>
            <div className="identity-terminal-body">
              <div className="terminal-command micro-label">
                <span className="accent">~</span> $ neofetch
              </div>
              <div className="terminal-identity">
                <pre className="terminal-monogram" aria-hidden="true">{String.raw`  _____    _____
 / ____|  / ____|
| |      | |
| |      | |
| |____  | |____
 \_____|  \_____|`}</pre>
                <div>
                  <strong style={{ color: accentColor }}>
                    {username}
                    <span className="muted">@jedkx</span>
                  </strong>
                  <span className="micro-label muted">HUMAN / DEVELOPER / EXPLORER</span>
                </div>
              </div>
              <dl className="identity-lines">
                {INFO_LINES.map(({ key, value }) => (
                  <div key={key}>
                    <dt style={{ color: accentColor }}>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <a href={`mailto:${CONTACT_EMAIL}`} className="terminal-email hoverable">
                {CONTACT_EMAIL}
                <ArrowUpRight size={15} />
              </a>
              <div className="terminal-command micro-label" aria-hidden="true">
                <span className="accent">~</span> ${' '}
                <span className="terminal-cursor terminal-caret" />
              </div>
            </div>
          </div>
        </div>
        <section id="cv" className="resume-section" aria-labelledby="cv-heading">
          <div>
            <span className="micro-label muted">EXPERIENCE & EDUCATION</span>
            <h3 id="cv-heading">The full picture.</h3>
          </div>
          <a
            href={`https://drive.google.com/file/d/${CV_DRIVE_FILE_ID}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="signal-link hoverable"
          >
            VIEW MY CV <ArrowUpRight size={22} />
          </a>
        </section>
      </div>
    </section>
  );
};
