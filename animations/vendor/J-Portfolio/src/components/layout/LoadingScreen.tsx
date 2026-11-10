import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { usePrefersReducedMotion } from '@/hooks';
import { HiddenResident } from '@/components/game/HiddenResident';
import { residentIntro, residentIntroBlinks, residentIntroPoses } from '@/assets/residentIntro';

const BOOT_LINES = [
  '> LOADING PROFILE...',
  '> PREPARING PROJECTS...',
  '> LOADING INTERACTIONS...',
  '> PREPARING THE PAGE...',
  '> ALMOST THERE...',
  '> READY.',
];

// The percentage represents this staged boot sequence, not a network transfer.
export const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const root = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [introFrame, setIntroFrame] = useState(0);
  const [introEyes, setIntroEyes] = useState<readonly [number, number] | undefined>();
  const [currentLine, setCurrentLine] = useState(0);
  const reduced = usePrefersReducedMotion();
  useLayoutEffect(() => {
    let live = true,
      started = false;
    let context: gsap.Context | undefined;
    const prints: HTMLElement[] = [];
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const start = () => {
      if (!live || started) return;
      started = true;
      if (reduced) {
        onComplete();
        return;
      }
      context = gsap.context(() => {
        const letter = root.current!.querySelector<HTMLElement>('.boot-letter-d')!;
        const ghost = root.current!.querySelector<HTMLElement>('.boot-ghost-d')!;
        const mouth = root.current!.querySelector<HTMLElement>('.resident-mouth')!;
        const copy = root.current!.querySelector<HTMLElement>('.site-boot-copy')!;
        let printedLetter = letter;
        const printSurface = () => {
          const rect = copy.getBoundingClientRect();
          root.current!.querySelectorAll<HTMLElement>('.boot-page').forEach((panel) => {
            const print = copy.cloneNode(true) as HTMLElement;
            print.classList.replace('site-boot-copy', 'boot-print');
            print.setAttribute('aria-hidden', 'true');
            Object.assign(print.style, {
              position: 'absolute',
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              margin: '0',
              opacity: '1',
              visibility: 'visible',
              transform: 'none',
            });
            panel.appendChild(print);
            prints.push(print);
          });
          printedLetter =
            prints[
              letter.getBoundingClientRect().top < innerHeight / 2 ? 0 : 1
            ].querySelector<HTMLElement>('.boot-letter-d')!;
        };
        const boot = { value: 0 };
        const updateBoot = () => {
          if (percent.current) percent.current.textContent = Math.round(boot.value) + '%';
          if (bar.current) bar.current.style.transform = `scaleX(${boot.value / 100})`;
          // The split surfaces contain visual copies; advance those as well.
          root.current
            ?.querySelectorAll<HTMLElement>('.boot-print .boot-progress > span')
            .forEach((node) => {
              node.textContent = Math.round(boot.value) + '%';
            });
          root.current
            ?.querySelectorAll<HTMLElement>('.boot-print .site-boot-track > span')
            .forEach((node) => {
              node.style.transform = `scaleX(${boot.value / 100})`;
            });
        };
        const sequence = gsap.timeline({ onComplete });
        residentIntroPoses.forEach(({ at, frame }) =>
          sequence.call(() => setIntroFrame(frame), [], at)
        );
        residentIntroBlinks.forEach(({ at, eyes }) =>
          sequence.call(() => setIntroEyes(eyes), [], at)
        );
        sequence.call(() => setIntroEyes(undefined), [], residentIntro.prepare);
        sequence
          .from('.site-boot-copy', { opacity: 0, y: 12, duration: 0.5, ease: 'power3.out' }, 0)
          .call(() => setCurrentLine(1), [], 0)
          .call(() => setCurrentLine(2), [], 0.85)
          .to(
            boot,
            { value: 100, duration: residentIntro.ready, ease: 'none', onUpdate: updateBoot },
            0
          )
          .call(printSurface, [], 1.48)
          .set(copy, { autoAlpha: 0 }, 1.5)
          .set(root.current, { attr: { 'data-rift-state': 'open' } }, 1.5)
          .to(
            '.boot-page-top',
            { yPercent: -24, rotation: 0, duration: 1.1, ease: 'power3.inOut' },
            1.5
          )
          .to(
            '.boot-page-bottom',
            { yPercent: 24, rotation: 0, duration: 1.1, ease: 'power3.inOut' },
            1.5
          )
          .from(
            '.boot-backstage .hidden-resident',
            { opacity: 0, duration: 0.35, ease: 'sine.out' },
            1.9
          )
          .call(
            () => {
              root
                .current!.querySelectorAll('.boot-letter-d')
                .forEach((node) => gsap.set(node, { opacity: 0 }));
            },
            [],
            residentIntro.lift
          )
          .fromTo(
            ghost,
            {
              x: () => printedLetter.getBoundingClientRect().left,
              y: () => printedLetter.getBoundingClientRect().top,
              fontSize: () => getComputedStyle(printedLetter).fontSize,
              fontFamily: () => getComputedStyle(printedLetter).fontFamily,
              fontWeight: () => getComputedStyle(printedLetter).fontWeight,
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              xPercent: 0,
              yPercent: 0,
            },
            {
              x: () => {
                const rect = mouth.getBoundingClientRect();
                return rect.left + rect.width / 2;
              },
              y: () => {
                const rect = mouth.getBoundingClientRect();
                return rect.top + rect.height / 2;
              },
              xPercent: -50,
              yPercent: -50,
              scale: 0.55,
              rotation: 0,
              duration: residentIntro.arrive - residentIntro.lift,
              ease: 'power2.inOut',
              immediateRender: false,
            },
            residentIntro.lift
          )
          .to(
            ghost,
            { scale: 0.025, autoAlpha: 0, duration: 0.18, ease: 'power2.in' },
            residentIntro.arrive
          )
          .to(
            '.boot-page-top',
            { yPercent: 0, rotation: 0, duration: 0.65, ease: 'power3.inOut' },
            residentIntro.close
          )
          .to(
            '.boot-page-bottom',
            { yPercent: 0, rotation: 0, duration: 0.65, ease: 'power3.inOut' },
            residentIntro.close
          )
          .set('.boot-page', { clearProps: 'transform' }, residentIntro.closed)
          .set(root.current, { attr: { 'data-rift-state': 'closed' } }, residentIntro.closed)
          .set(copy, { autoAlpha: 1 }, residentIntro.closed)
          .call(() => prints.forEach((print) => print.remove()), [], residentIntro.closed + 0.01)
          .call(() => setCurrentLine(3), [], residentIntro.closed)
          .call(() => setCurrentLine(4), [], 8.25)
          .call(() => setCurrentLine(5), [], 8.9)
          .call(() => setCurrentLine(6), [], residentIntro.ready)
          .to(
            root.current,
            { opacity: 0, duration: 1.1, ease: 'sine.inOut' },
            residentIntro.reveal
          );
      }, root);
    };
    const fallback = window.setTimeout(start, 1100);
    void document.fonts.ready.then(start);
    return () => {
      live = false;
      window.clearTimeout(fallback);
      context?.revert();
      prints.forEach((print) => print.remove());
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete, reduced]);
  return (
    <div
      ref={root}
      className="site-boot boot-theatre boot-restored"
      data-rift-state="closed"
      role="status"
      aria-label="Portfolio boot sequence"
    >
      <div className="boot-backstage" aria-hidden="true">
        <HiddenResident cameo frameOverride={introFrame} eyesOverride={introEyes} />
      </div>
      <div className="boot-page boot-page-top" aria-hidden="true" />
      <div className="boot-page boot-page-bottom" aria-hidden="true" />
      <div className="site-boot-copy">
        <span className="site-boot-label">CANER COŞKUN / PORTFOLIO</span>
        <h1 aria-label="Hello friend">
          HELLO{' '}
          <span>
            FRIEN<span className="boot-letter-d">D</span>
          </span>
        </h1>
        <div className="boot-lines" aria-hidden="true">
          {BOOT_LINES.map((line, index) => (
            <div
              className={
                index < currentLine ? (index === currentLine - 1 ? 'is-current' : 'is-visible') : ''
              }
              key={line}
            >
              {line}
            </div>
          ))}
        </div>
        <div className="boot-progress" aria-hidden="true">
          <div className="site-boot-track">
            <span ref={bar} />
          </div>
          <span ref={percent}>0%</span>
        </div>
      </div>
      <span className="boot-ghost-d" aria-hidden="true">
        D
      </span>
      <button type="button" className="site-boot-skip hoverable" onClick={onComplete}>
        SKIP INTRO ↗
      </button>
    </div>
  );
};
