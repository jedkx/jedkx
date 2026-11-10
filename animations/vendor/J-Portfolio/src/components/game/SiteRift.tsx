import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { HiddenResident } from './HiddenResident';
import { usePrefersReducedMotion } from '@/hooks';
import {
  residentSpokenWord,
  residentReactionLines,
  type ResidentReaction,
} from '@/assets/residentAnimation';

const returnGreetings = [
  'Oh... it’s you again. Hi.',
  'Back already? I saved your spot.',
  'Hello again, friend. Still our secret?',
  'I was hoping you’d stop by.',
];

export const SiteRift: React.FC<{
  onClose: () => void;
  visit?: number;
  viaPassphrase?: boolean;
}> = ({ onClose, visit = 1, viaPassphrase = false }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const motion = useRef<gsap.core.Timeline | null>(null);
  const closing = useRef(false);
  const ready = useRef(false);
  const visited = useRef(false);
  const closeTimer = useRef(0);
  const reactionVisits = useRef<Partial<Record<ResidentReaction, number>>>({});
  const [message, setMessage] = useState(() =>
    visit > 1
      ? returnGreetings[(visit - 2) % returnGreetings.length]
      : viaPassphrase
        ? 'You knew what to say. Hello, friend.'
        : 'Five fragments... you really came looking for me.'
  );
  const [typed, setTyped] = useState('');
  const [departing, setDeparting] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!speechReady) return;
    if (reduced) {
      setTyped(message);
      return;
    }
    setTyped('');
    const letters = Array.from(message);
    let length = 0;
    let timer = 0;
    const type = () => {
      setTyped(letters.slice(0, ++length).join(''));
      if (length < letters.length) {
        const punctuation = /[.,!?…]/.test(letters[length - 1]);
        timer = window.setTimeout(type, punctuation ? 160 : 28);
      }
    };
    timer = window.setTimeout(type, 28);
    return () => window.clearTimeout(timer);
  }, [message, reduced, speechReady]);
  const reactToFace = useCallback((hovered: boolean) => {
    if (!ready.current || closing.current) return;
    if (hovered) {
      visited.current = true;
      setMessage('Oh... hi. A little close, aren’t you?');
    } else if (visited.current) setMessage('You can stay. Just... don’t tell anyone.');
  }, []);
  const reactToMotion = useCallback((reaction: ResidentReaction) => {
    if (!ready.current || closing.current) return;
    const lines = residentReactionLines[reaction];
    const count = reactionVisits.current[reaction] ?? 0;
    reactionVisits.current[reaction] = count + 1;
    setMessage(lines[count % lines.length]);
  }, []);
  useLayoutEffect(() => {
    const element = dialog.current!;
    const source = document.querySelector<HTMLElement>('[data-secret-surface]');
    const oldOverflow = document.body.style.overflow;
    const scroll = window.scrollY;
    const width = source?.getBoundingClientRect().width ?? innerWidth;
    for (const panel of [top.current, bottom.current]) {
      if (!source || !panel) continue;
      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-secret-surface');
      clone.removeAttribute('inert');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      clone.classList.add('rift-page-clone');
      clone.style.width = `${width}px`;
      clone.style.top = `${-scroll}px`;
      clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      const navigation = clone.querySelector<HTMLElement>('.signal-nav');
      if (navigation) {
        navigation.style.position = 'absolute';
        navigation.style.top = `${scroll}px`;
      }
      panel.appendChild(clone);
    }
    element.showModal();
    element.focus({ preventScroll: true });
    ready.current = true;
    document.body.style.overflow = 'hidden';
    const ctx = gsap.context(() => {
      if (reduced) {
        setSpeechReady(true);
        gsap.set('.rift-shutter', { autoAlpha: 0 });
        return;
      }
      motion.current = gsap
        .timeline({ onReverseComplete: onClose })
        .to('.rift-seam', { scaleX: 1, duration: 0.4, ease: 'power3.inOut' })
        .to('.rift-top', { yPercent: -54, rotation: -1.5, duration: 1.4, ease: 'expo.inOut' }, 0.25)
        .to(
          '.rift-bottom',
          { yPercent: 54, rotation: 1.5, duration: 1.4, ease: 'expo.inOut' },
          0.25
        )
        .to('.rift-seam', { autoAlpha: 0, duration: 0.4 }, 0.55)
        .from(
          '.rift-presence',
          { scale: 0.7, autoAlpha: 0, duration: 1.7, ease: 'power3.out' },
          0.55
        )
        .from(
          '.rift-message, .rift-exit',
          { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.12 },
          1.8
        )
        .call(() => setSpeechReady(true), [], 1.8);
    }, dialog);
    return () => {
      ready.current = false;
      window.clearTimeout(closeTimer.current);
      motion.current?.kill();
      ctx.revert();
      motion.current = null;
      top.current?.replaceChildren();
      bottom.current?.replaceChildren();
      document.body.style.overflow = oldOverflow;
      if (element.open) element.close();
    };
  }, [reduced, onClose]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setDeparting(true);
    setSpeechReady(true);
    setMessage('Thank you for keeping me hidden.');
    if (reduced || !dialog.current || !motion.current) {
      closeTimer.current = window.setTimeout(onClose, 1400);
      return;
    }
    motion.current.kill();
    const element = dialog.current;
    gsap.set(element.querySelector('.rift-message'), { autoAlpha: 1, y: 0 });
    // Close from the current pose, not by reversing unrelated reveal/idle beats.
    motion.current = gsap
      .timeline({
        delay: 1.5,
        onComplete: () => {
          gsap.set([top.current, bottom.current], { clearProps: 'transform' });
          onClose();
        },
      })
      .to(
        element.querySelectorAll('.rift-message, .rift-exit, .rift-seam'),
        { autoAlpha: 0, duration: 0.15 },
        0
      )
      .to(
        [top.current, bottom.current],
        { x: 0, y: 0, yPercent: 0, rotation: 0, duration: 0.8, ease: 'power3.inOut' },
        0.05
      )
      .to(element.querySelector('.rift-presence'), { autoAlpha: 0, duration: 0.25 }, 0.55);
  };
  return (
    <dialog
      ref={dialog}
      className="resident-rift-dialog"
      data-secret-ui
      tabIndex={-1}
      aria-labelledby="rift-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="rift-room">
        <div className="rift-message">
          <span className="secret-eyebrow">UNLISTED PROCESS / FOUND</span>
          <h2 id="rift-title" aria-label={message} aria-live="polite">
            <span aria-hidden="true">{typed}</span>
            <span className="rift-message-caret" aria-hidden="true" />
          </h2>
        </div>
        <div className="rift-presence">
          <HiddenResident
            onFaceHoverChange={reactToFace}
            onReaction={reactToMotion}
            departing={departing}
            speechText={residentSpokenWord(message, typed)}
            speaking={speechReady && typed.length < message.length && !/[.,!?…]\s*$/.test(typed)}
          />
        </div>
        <button type="button" className="rift-exit hoverable" onClick={close} disabled={departing}>
          {departing ? 'Your secret is safe.' : 'I’ll keep your secret. ↗'}
        </button>
      </div>
      <div className="rift-shutter rift-top" ref={top} aria-hidden="true" />
      <div className="rift-shutter rift-bottom" ref={bottom} aria-hidden="true" />
      <div className="rift-seam" aria-hidden="true" />
    </dialog>
  );
};
