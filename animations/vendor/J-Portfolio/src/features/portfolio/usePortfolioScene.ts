import { useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { projectStep, galleryIndexAt, galleryDistance, NAV_OFFSET } from './scene';
interface SceneOptions {
  root: RefObject<HTMLElement | null>;
  projectCount: number;
  reduced: boolean;
  setActiveProject: (index: number) => void;
  setTransitioning: (active: boolean) => void;
  setInspecting: (active: boolean) => void;
}
export function usePortfolioScene({
  root,
  projectCount,
  reduced,
  setActiveProject,
  setTransitioning,
  setInspecting,
}: SceneOptions) {
  const sceneContext = useRef<gsap.Context | undefined>(undefined);
  const galleryTrigger = useRef<ScrollTrigger | undefined>(undefined);
  const viewportHeight = () =>
    (root.current?.querySelector<HTMLElement>('.experience-stage')?.clientHeight ??
      innerHeight - NAV_OFFSET) + NAV_OFFSET;
  const galleryStep = () => projectStep(viewportHeight());
  useLayoutEffect(() => {
    if (reduced || projectCount === 0) return;
    setTransitioning(false);
    setInspecting(false);
    const ctx = gsap.context(() => {
      const windowElement = root.current!.querySelector('.experience-window');
      const panels = gsap.utils.toArray<HTMLElement>('.work-panel');
      gsap.set('.work-controls', { autoAlpha: 1, y: 0 });
      if (panels.length) gsap.set(panels, { autoAlpha: 0 });
      if (panels[0]) gsap.set(panels[0], { autoAlpha: 1 });
      let currentIndex = -1;
      const syncGallery = (time: number) => {
        const index = galleryIndexAt(time, panels.length);
        if (index !== currentIndex) {
          currentIndex = index;
          setActiveProject(index);
          setInspecting(false);
        }
        const between = time % 1;
        setTransitioning(between > 0.2 && between < 0.98 && time < panels.length - 1);
      };
      const gallery = gsap.timeline({
        defaults: { ease: 'sine.inOut' },
        onUpdate: function () {
          syncGallery(this.time());
        },
        scrollTrigger: {
          trigger: root.current,
          start: `top top+=${NAV_OFFSET}`,
          end: () => `+=${galleryDistance(viewportHeight(), panels.length)}`,
          scrub: 0.18,
          snap: {
            snapTo: (progress) =>
              document.body.dataset.chapterNavigating === 'true' ||
              document.body.dataset.galleryNavigating === 'true'
                ? progress
                : Math.round(progress * Math.max(1, panels.length)) / Math.max(1, panels.length),
            duration: { min: 0.15, max: 0.3 },
            delay: 0.2,
            inertia: false,
            directional: false,
          },
          invalidateOnRefresh: true,
          onRefresh: (trigger) => {
            const time = trigger.progress * Math.max(1, panels.length);
            trigger.animation?.time(time, true);
            syncGallery(time);
          },
        },
      });
      galleryTrigger.current = gallery.scrollTrigger;
      panels.slice(1).forEach((panel, offset) => {
        const start = offset + 0.2;
        const previous = panels[offset];
        gallery.to(previous, { autoAlpha: 0, yPercent: -3, duration: 0.78 }, start);
        gallery.fromTo(
          panel,
          { autoAlpha: 0, yPercent: 3, scale: 1, clipPath: 'inset(100% 0% 0% 0%)' },
          {
            autoAlpha: 1,
            yPercent: 0,
            scale: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.78,
          },
          start
        );
        gallery.fromTo(
          panel.querySelector('.repository-visual-inner'),
          { scale: 1.1, yPercent: 5 },
          { scale: 1, yPercent: 0, duration: 0.78, ease: 'power2.out' },
          start
        );
        gallery.fromTo(
          panel.querySelectorAll('.title-letter'),
          { yPercent: 105, rotationX: 0, opacity: 0 },
          {
            yPercent: 0,
            rotationX: 0,
            opacity: 1,
            duration: 0.5,
            stagger: { amount: 0.12 },
            ease: 'power3.out',
          },
          start + 0.14
        );
        gallery.fromTo(
          panel.querySelector('.work-description'),
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          start + 0.2
        );
      });
      // A short release into document flow rather than an abrupt unpin.
      const exit = Math.max(0, panels.length - 1) + 0.4;
      gallery.to(windowElement, { yPercent: -2, scale: 0.985, duration: 0.6 }, exit);
      gallery.to('.work-controls', { autoAlpha: 0, y: -8, duration: 0.4 }, exit + 0.2);
      gallery.to({}, { duration: 0.01 }, Math.max(1, panels.length) - 0.01);

      ScrollTrigger.refresh();
      const trigger = gallery.scrollTrigger!;
      const time =
        gsap.utils.clamp(0, 1, (scrollY - trigger.start) / (trigger.end - trigger.start)) *
        Math.max(1, panels.length);
      gallery.time(time);
      syncGallery(time);
    }, root);
    sceneContext.current = ctx;
    return () => {
      ctx.revert();
      sceneContext.current = undefined;
      galleryTrigger.current = undefined;
    };
  }, [root, projectCount, reduced, setActiveProject, setTransitioning, setInspecting]);
  return { sceneContext, galleryTrigger, galleryStep };
}
