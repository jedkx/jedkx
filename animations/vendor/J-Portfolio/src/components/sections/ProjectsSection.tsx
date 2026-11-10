import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { usePrefersReducedMotion } from '@/hooks';
import { GITHUB_USERNAME } from '@/lib/github';

import { RepositoryVisual } from '@/features/portfolio/RepositoryVisual';
export { RepositoryVisual };

export const ProjectsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { projects, status, retry } = useProjects();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !projects.length) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.repository-scene').forEach((scene) => {
        const card = scene.querySelector('.repository-card');
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: scene,
            start: 'top 90%',
            end: 'top 8%',
            scrub: 0.7,
          },
        });
        timeline.fromTo(
          card,
          { clipPath: 'inset(12% 9% 12% 9% round 3px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 3px)', ease: 'power2.out' },
          0
        );
        timeline.fromTo(
          scene.querySelector('.repository-visual-inner'),
          { scale: 1.35 },
          { scale: 1, ease: 'none' },
          0
        );
        timeline.fromTo(
          scene.querySelector('.repository-copy'),
          { y: 70, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power2.out' },
          0.2
        );
        const artwork = scene.querySelector('.artifact-orbits');
        if (artwork)
          gsap.to(artwork, {
            rotation: 65,
            svgOrigin: '400 300',
            ease: 'none',
            scrollTrigger: {
              trigger: scene,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          });
      });
    }, sectionRef);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [projects.length, prefersReducedMotion]);

  return (
    <section ref={sectionRef} id="projects" className="repository-section editorial-shell">
      <header className="repository-heading">
        <div>
          <span className="micro-label muted">SELECTED FROM GITHUB</span>
          <h2 className="editorial-heading">
            PROJECTS<span className="accent">.</span>
          </h2>
        </div>
        <a
          href={`https://github.com/${GITHUB_USERNAME}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
          className="signal-link hoverable"
        >
          ALL REPOSITORIES <ArrowUpRight size={18} />
        </a>
      </header>
      {status === 'loading' && (
        <p className="repository-state" role="status">
          Loading projects from GitHub…
        </p>
      )}
      {status === 'error' && (
        <div className="repository-state" role="status">
          <p>GitHub is unavailable right now.</p>
          <button type="button" className="signal-link hoverable" onClick={retry}>
            TRY AGAIN <ArrowUpRight size={16} />
          </button>
        </div>
      )}
      {status === 'cached' && (
        <div className="repository-cache-note">
          <span>Showing the last saved projects. GitHub is temporarily unavailable.</span>
          <button type="button" onClick={retry} className="hoverable">
            Retry
          </button>
        </div>
      )}
      {status === 'ready' && projects.length === 0 && (
        <p className="repository-state">No public projects to show yet.</p>
      )}
      <div className="repository-grid">
        {projects.map((project, index) => (
          <div key={project.id} className="repository-scene">
            <article className="repository-card">
              <a
                href={`https://github.com/${GITHUB_USERNAME}/${encodeURIComponent(project.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="repository-link hoverable"
                aria-label={`View ${project.name} on GitHub`}
              >
                <RepositoryVisual project={project} index={index} />
                <div className="repository-copy">
                  <span className="repository-index micro-label">
                    {String(index + 1).padStart(2, '0')} /{' '}
                    {String(projects.length).padStart(2, '0')}
                  </span>
                  <div className="repository-title">
                    <h3>{project.name}</h3>
                    <span className="micro-label muted">{project.language}</span>
                  </div>
                  {project.description && <p>{project.description}</p>}
                </div>
              </a>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
};
