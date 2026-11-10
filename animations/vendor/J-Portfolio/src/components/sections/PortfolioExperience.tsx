import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/dist/Flip';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Maximize2, Minimize2 } from 'lucide-react';
import { ParticleBackground } from '@/components/layout/ParticleBackground';
import { SecretWords } from '@/components/game/SecretGame';
import { useProjects } from '@/hooks/useProjects';
import { usePrefersReducedMotion } from '@/hooks';
import { projectTitle } from '@/features/portfolio/presentation';
import { CV_DRIVE_FILE_ID } from '@/constants/config';
import { NeofetchTerminal } from './NeofetchTerminal';
import { RepositoryVisual } from '@/features/portfolio/RepositoryVisual';
import { usePortfolioScene } from '@/features/portfolio/usePortfolioScene';
import '@/styles/experience.css';
import Magnet from '@/components/react-bits/Magnet';

gsap.registerPlugin(Flip);

export const PortfolioExperience: React.FC<{ accentColor: string; active?: boolean }> = ({
  accentColor,
  active = true,
}) => {
  const root = useRef<HTMLElement>(null);
  const about = useRef<HTMLElement>(null);
  const steering = useRef<ReturnType<typeof gsap.quickTo>[]>([]);
  const projectMove = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    const stop = () => {
      projectMove.current?.kill();
      delete document.body.dataset.galleryNavigating;
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    return () => {
      stop();
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
  }, []);
  const { projects, status, retry } = useProjects();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [compact, setCompact] = useState(() => window.matchMedia('(max-height: 600px)').matches);
  const [overflowFlow, setOverflowFlow] = useState(false);
  const reduced = prefersReducedMotion || compact || overflowFlow;
  const [activeProject, setActiveProject] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [played, setPlayed] = useState(false);
  const hasProjects = projects.length > 0;
  useEffect(() => {
    if (!about.current) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    observer.observe(about.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  // Keep the existing gallery when it fits. On small screens that cannot fit
  // a whole project, release it into document flow instead of nesting scrolls.
  useLayoutEffect(() => {
    if (prefersReducedMotion || compact || overflowFlow || !hasProjects) return;
    const panels = [...(root.current?.querySelectorAll<HTMLElement>('.work-panel') ?? [])];
    const check = () => {
      if (window.innerWidth > 767 || inspecting) return;
      if (
        panels.some(
          (panel) => panel.clientHeight > 0 && panel.scrollHeight > panel.clientHeight + 2
        )
      ) {
        setOverflowFlow(true);
      }
    };
    const observer = new ResizeObserver(check);
    panels.forEach((panel) => {
      observer.observe(panel);
      const copy = panel.querySelector('.work-copy');
      if (copy) observer.observe(copy);
    });
    check();
    return () => observer.disconnect();
  }, [prefersReducedMotion, compact, overflowFlow, hasProjects, projects, inspecting]);
  useEffect(() => {
    const reset = () => setOverflowFlow(false);
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, []);
  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('.about-terminal', {
        y: 28,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: about.current, start: 'top 85%', once: true },
      });
    }, about);
    return () => ctx.revert();
  }, [prefersReducedMotion]);

  useEffect(() => {
    const query = window.matchMedia('(max-height: 600px)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const { sceneContext, galleryTrigger, galleryStep } = usePortfolioScene({
    root,
    projectCount: projects.length,
    reduced,
    setActiveProject,
    setTransitioning,
    setInspecting,
  });

  useEffect(() => {
    if (reduced) return;
    const depth = root.current?.querySelectorAll('.repository-depth')[activeProject];
    if (!depth) return;
    gsap.set(depth, { transformPerspective: 1000, transformOrigin: '50% 45%' });
    steering.current = ['rotationY', 'rotationX', 'x', 'y'].map((property) =>
      gsap.quickTo(depth, property, { duration: 0.65, ease: 'power3.out' })
    );
    return () => {
      steering.current.forEach((move) => move.tween.kill());
      steering.current = [];
      gsap.set(depth, { clearProps: 'transform' });
    };
  }, [activeProject, projects.length, reduced]);

  const resetPointer = () => steering.current.forEach((move) => move(0));
  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || inspecting || transitioning || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    [x * 10, -y * 8, x * 18, y * 12].forEach((value, index) => steering.current[index]?.(value));
  };

  const goProject = (index: number) => {
    if (index < 0 || index >= projects.length) return;
    // Lazy profile/chart content may have settled since the last scene refresh.
    ScrollTrigger.refresh();
    const trigger = galleryTrigger.current;
    if (trigger) {
      projectMove.current?.kill();
      document.body.dataset.galleryNavigating = 'true';
      const snap = trigger.getTween(true);
      if (snap && typeof snap.kill === 'function') snap.kill();
      const scroll = { y: window.scrollY };
      projectMove.current = gsap.to(scroll, {
        y: trigger.start + index * galleryStep(),
        duration: prefersReducedMotion ? 0 : 0.55,
        ease: 'power2.inOut',
        onUpdate: () => window.scrollTo({ top: scroll.y, behavior: 'instant' }),
        onComplete: () => {
          delete document.body.dataset.galleryNavigating;
        },
      });
    }
  };

  const toggleInspect = () => {
    if (transitioning) return;
    const panel = root.current!.querySelectorAll<HTMLElement>('.work-panel')[activeProject];
    if (!panel) return;
    resetPointer();
    const visual = panel.querySelector('.repository-visual-inner');
    const state = Flip.getState(visual!);
    flushSync(() => setInspecting(!inspecting));
    sceneContext.current?.add(() =>
      Flip.from(state, { duration: 0.75, ease: 'expo.inOut', scale: true })
    );
  };

  return (
    <>
      <section id="hero" className="portfolio-landing">
        <div
          className="experience-stage"
          data-playground-active={active ? 'true' : 'false'}
          onPointerDown={() => setPlayed(true)}
        >
          <ParticleBackground />
          <div className="experience-name">
            <span className="micro-label experience-role">
              <SecretWords id="hero-role" text="FULL-STACK DEVELOPER" />
            </span>
            <h1 aria-label="Caner Coşkun">
              <span className="name-first" aria-hidden="true">
                <span className="name-typeset">CANER</span>
              </span>
              <span className="name-last" aria-hidden="true">
                <span className="name-typeset">COŞKUN</span>
              </span>
            </h1>
          </div>
          <div className="experience-intro">
            <Magnet padding={20} maxOffset={8} magnetStrength={6} disabled={prefersReducedMotion}>
              <a
                href={`https://drive.google.com/file/d/${CV_DRIVE_FILE_ID}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="hoverable"
              >
                VIEW CV <ArrowUpRight size={16} />
              </a>
            </Magnet>
          </div>
          <div className="hero-cue" aria-hidden="true">
            {!played && (
              <span className="hero-cue-label">
                <i />
                Hold to interact
              </span>
            )}
            <span className="hero-cue-line" />
            <ArrowDown size={15} />
          </div>
        </div>
      </section>
      <section
        id="about"
        ref={about}
        className="about-chapter editorial-shell"
        aria-label="About Caner"
      >
        <div className="chapter-register">
          <span>01 / ABOUT</span>
          <span>canercoskun@jedkx — zsh</span>
        </div>
        <div className="about-terminal">
          <div className="window-chrome">
            <span className="window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>~ $ neofetch</span>
            <span>PROFILE</span>
          </div>
          <div className="experience-profile" data-terminal-active="true">
            <NeofetchTerminal accentColor={accentColor} />
          </div>
        </div>
      </section>
      <section
        id="projects"
        ref={root}
        className={`portfolio-experience project-gallery${reduced ? ' experience-static' : ''}`}
        style={{ '--project-steps': Math.max(1, projects.length) } as React.CSSProperties}
        aria-label="Projects"
        onKeyDown={(event) => {
          if (
            (event.target as HTMLElement).closest(
              'input, textarea, select, [contenteditable="true"]'
            )
          )
            return;
          if (reduced || inspecting || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          goProject(activeProject + (event.key === 'ArrowRight' ? 1 : -1));
        }}
      >
        <div className="experience-stage">
          <div className="work-kicker micro-label">
            02 / WORK <span>PUBLIC REPOSITORIES</span>
          </div>
          <div className="experience-window" data-screen-active="true" data-scene="work">
            <div
              className="work-viewport"
              aria-busy={transitioning}
              onPointerMove={movePointer}
              onPointerLeave={resetPointer}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && inspecting) toggleInspect();
              }}
            >
              {projects.map((project, index) => (
                <article
                  key={project.id}
                  className={`work-panel${inspecting && activeProject === index ? ' is-inspecting' : ''}`}
                  inert={!reduced && activeProject !== index}
                  aria-hidden={!reduced && activeProject !== index}
                >
                  <RepositoryVisual project={project} index={index} />
                  <div
                    className="work-copy"
                    inert={inspecting && activeProject === index}
                    aria-hidden={inspecting && activeProject === index}
                  >
                    <span className="micro-label work-number">
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {String(projects.length).padStart(2, '0')}{' '}
                      <span>{project.language ?? 'OPEN SOURCE'}</span>
                    </span>
                    <h2 aria-label={projectTitle(project.name)}>
                      {Array.from(projectTitle(project.name)).map((letter, letterIndex) => (
                        <span className="title-letter-mask" key={letterIndex} aria-hidden="true">
                          <span className="title-letter">{letter}</span>
                        </span>
                      ))}
                    </h2>
                    <div className="work-description">
                      <p>{project.description}</p>
                      <a
                        className="hoverable"
                        href={`https://github.com/jedkx/${encodeURIComponent(project.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        EXPLORE REPOSITORY <ArrowUpRight size={20} />
                      </a>
                    </div>
                  </div>
                  {!reduced && (
                    <button
                      type="button"
                      className="inspect-preview hoverable"
                      aria-expanded={inspecting && activeProject === index}
                      onClick={toggleInspect}
                    >
                      {inspecting && activeProject === index ? (
                        <>
                          <Minimize2 size={16} /> CLOSE PREVIEW
                        </>
                      ) : (
                        <>
                          <Maximize2 size={16} /> EXPAND PREVIEW
                        </>
                      )}
                    </button>
                  )}
                </article>
              ))}
              {!hasProjects && (
                <div className="experience-empty" role="status">
                  <h2>WORK IN THE OPEN.</h2>
                  <p>
                    {status === 'loading'
                      ? 'Loading public repositories…'
                      : status === 'ready'
                        ? 'No public repositories to show yet.'
                        : 'GitHub is unavailable right now.'}
                  </p>
                  {status !== 'loading' && status !== 'ready' && (
                    <button className="signal-link hoverable" onClick={retry}>
                      TRY AGAIN <ArrowRight size={16} />
                    </button>
                  )}
                  <a
                    href="https://github.com/jedkx?tab=repositories"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VIEW ON GITHUB ↗
                  </a>
                </div>
              )}
            </div>
          </div>
          <nav className="work-controls" aria-label="Project navigation">
            <span className="micro-label">
              {status === 'cached' ? 'SAVED FROM GITHUB' : 'PUBLIC REPOSITORIES'}
            </span>
            <div className="work-dots">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  className={`hoverable${activeProject === index ? ' is-active' : ''}`}
                  aria-label={`Show ${project.name}`}
                  aria-current={activeProject === index ? 'true' : undefined}
                  onClick={() => goProject(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
            <div className="work-arrows">
              <button
                className="hoverable"
                aria-label="Previous project"
                disabled={activeProject <= 0}
                onClick={() => goProject(activeProject - 1)}
              >
                <ArrowLeft size={20} />
              </button>
              <button
                className="hoverable"
                aria-label="Next project"
                disabled={activeProject >= projects.length - 1}
                onClick={() => goProject(activeProject + 1)}
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </nav>
        </div>
      </section>
    </>
  );
};
