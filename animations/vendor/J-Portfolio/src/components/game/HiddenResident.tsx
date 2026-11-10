import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { usePrefersReducedMotion } from '@/hooks';
import { ResidentMotionExport } from '@/assets/ResidentMotionExport';
import {
  clipFrames,
  residentFrames,
  residentAction,
  residentBlink,
  residentSpeechFrame,
  residentCanInteract,
  residentIdleCue,
  type ResidentClip,
  residentCanWake,
  type ResidentReaction,
} from '@/assets/residentAnimation';

export const HiddenResident: React.FC<{
  cameo?: boolean;
  awake?: boolean;
  eating?: boolean;
  anticipating?: boolean;
  speaking?: boolean;
  speechText?: string;
  departing?: boolean;
  onFaceHoverChange?: (hovered: boolean) => void;
  onReaction?: (reaction: ResidentReaction) => void;
  frameOverride?: number;
  eyesOverride?: readonly [number, number];
}> = ({
  cameo = false,
  awake = true,
  eating = false,
  anticipating = false,
  speaking = false,
  speechText = '',
  departing = false,
  onFaceHoverChange,
  onReaction,
  frameOverride,
  eyesOverride,
}) => {
  const root = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [eyeFrames, setEyeFrames] = useState<readonly [number, number] | undefined>();
  const [recovering, setRecovering] = useState(false);
  const [greetingActive, setGreetingActive] = useState(false);
  const [shy, setShy] = useState(false);
  const [ambient, setAmbient] = useState<ResidentClip | null>(cameo ? null : 'notice');
  const [gaze, setGaze] = useState({ x: 0, y: 0, active: false });
  const wasEating = useRef(false);
  const cameoBlinkStarted = useRef(false);
  const busy = useRef(eating);
  const hoverTimer = useRef(0);
  const faceHovered = useRef(false);
  const lastPointer = useRef(Date.now());
  const lastAmbient = useRef(Date.now());
  const pointerSample = useRef({ x: 0, y: 0, time: 0 });
  const edgeGaze = useRef(false);
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;
  const ambientRef = useRef(ambient);
  ambientRef.current = ambient;
  const asleepSince = useRef<number | null>(null);
  const sleepAnchor = useRef({ x: 0, y: 0 });
  const waking = useRef(false);
  const reactionCallback = useRef(onReaction);
  reactionCallback.current = onReaction;
  const reduced = usePrefersReducedMotion();
  const action = residentAction({
    awake,
    departing,
    eating,
    anticipating,
    recovering,
    shy,
    greeting: greetingActive,
    ambient: ambient !== null,
  });
  busy.current = action !== 'idle';
  const actionRef = useRef(action);
  actionRef.current = action;
  const mouthFrame =
    speaking && !reduced && !cameo && action === 'idle'
      ? residentSpeechFrame(speechText)
      : undefined;
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    if (
      !cameo &&
      ambient &&
      ['sleepy', 'search', 'curious', 'startle', 'surprised'].includes(ambient)
    )
      reactionCallback.current?.(ambient as ResidentReaction);
  }, [ambient, cameo]);

  const wake = (deliberate: boolean, movedPx = 0) => {
    if (
      asleepSince.current === null ||
      !residentCanWake(Date.now() - asleepSince.current, movedPx, deliberate)
    )
      return;
    asleepSince.current = null;
    waking.current = true;
    lastPointer.current = Date.now();
    lastAmbient.current = Date.now();
    setAmbient('notice');
    reactionCallback.current?.('wake');
  };

  useEffect(() => {
    if (wasEating.current && !eating) setRecovering(true);
    wasEating.current = eating;
  }, [eating]);

  // One action owns the face. Lower-priority hover/click changes cannot restart it.
  useEffect(() => {
    if (frameOverride !== undefined) return;
    let timer = 0;
    let disposed = false;
    setEyeFrames(undefined);
    const finish = () => {
      setRecovering(false);
      setGreetingActive(false);
      setAmbient(null);
      asleepSince.current = null;
      waking.current = false;
    };
    const play = (clip: number[], done: () => void, step = 0, speed = 1) => {
      if (disposed) return;
      if (document.hidden) {
        timer = window.setTimeout(() => play(clip, done, step, speed), 200);
        return;
      }
      const index = clip[step];
      setFrame(index);
      timer = window.setTimeout(() => {
        if (step + 1 < clip.length) play(clip, done, step + 1, speed);
        else done();
      }, residentFrames[index].duration / speed);
    };
    const blink = (step = 0) => {
      if (disposed) return;
      if (document.hidden) {
        timer = window.setTimeout(() => blink(step), 200);
        return;
      }
      const [left, right, duration] = residentBlink[step];
      setEyeFrames([left, right]);
      timer = window.setTimeout(
        () => {
          if (step + 1 < residentBlink.length) blink(step + 1);
          else {
            setEyeFrames(undefined);
            idle();
          }
        },
        cameo ? duration * 1.3 : duration
      );
    };
    const idle = () => {
      setFrame(0);
      timer = window.setTimeout(
        () => {
          const now = Date.now();
          const cue =
            cameo || document.hidden
              ? null
              : residentIdleCue(
                  now - lastPointer.current,
                  now - lastAmbient.current,
                  speakingRef.current,
                  edgeGaze.current
                );
          if (cue) {
            lastAmbient.current = now;
            setAmbient(cue);
          } else blink();
        },
        cameo ? 1600 : 2200 + Math.random() * 2400
      );
    };
    if (reduced || action === 'sleep') {
      if (action === 'sleep') cameoBlinkStarted.current = false;
      setFrame(action === 'eat' || action === 'prepare' ? 29 : action === 'shy' ? 17 : 0);
      if (action === 'recover' || action === 'greet' || action === 'ambient') finish();
    } else if (action === 'farewell') play(clipFrames('goodbye'), () => setFrame(92));
    else if (action === 'eat')
      play([30, 31, 32, 33, 34, 35], () => setFrame(35), 0, cameo ? 0.85 : 1);
    else if (action === 'prepare') play([26, 27, 28, 29], () => setFrame(29));
    else if (action === 'recover') play([36, 37, 38], finish, 0, 1);
    else if (action === 'ambient' && ambient === 'sleepy') {
      sleepAnchor.current = pointerSample.current;
      // Stop on closed eyes; the asset's automatic wake-up tail is intentional-input only.
      play([61, 62, 63, 64, 65], () => {
        setFrame(65);
        asleepSince.current = Date.now();
      });
    } else if (action === 'ambient' && ambient === 'notice' && waking.current)
      play([68, 69, 70, 71], finish);
    else if (action === 'ambient' && ambient) play(clipFrames(ambient), finish);
    else if (action === 'greet') play(clipFrames('wink'), finish);
    else if (action === 'shy') {
      // One short settle, then hold. No extra blink or speech clip over it.
      play([13, 14, 17], () => setFrame(17));
    } else if (cameo && !cameoBlinkStarted.current) {
      cameoBlinkStarted.current = true;
      setFrame(0);
      blink();
    } else idle();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [action, reduced, cameo, ambient, frameOverride]);

  useLayoutEffect(() => {
    if (reduced || cameo || !root.current) return;
    const element = root.current;
    let visible = true;
    let restTimer = 0;
    let follow: (event: PointerEvent) => void = () => {};
    let sync: () => void = () => {};
    const ctx = gsap.context(() => {
      const breath = gsap.to('.resident-breath', {
        y: -1.5,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      const look = { x: 0, y: 0 };
      const paint = () =>
        setGaze((previous) => {
          const next = {
            x: Math.round(look.x * 8) / 8,
            y: Math.round(look.y * 8) / 8,
            active: true,
          };
          return previous.active && previous.x === next.x && previous.y === next.y
            ? previous
            : next;
        });
      const x = gsap.quickTo(look, 'x', { duration: 0.3, ease: 'power2.out', onUpdate: paint });
      const y = gsap.quickTo(look, 'y', { duration: 0.4, ease: 'power2.out', onUpdate: paint });
      follow = (event) => {
        if (!visible || document.hidden) return;
        const now = Date.now();
        if (actionRef.current === 'ambient' && ambientRef.current === 'sleepy') {
          wake(
            false,
            Math.hypot(event.clientX - sleepAnchor.current.x, event.clientY - sleepAnchor.current.y)
          );
          return;
        }
        if (busy.current) return;
        lastPointer.current = now;
        const rect = element.querySelector('.resident-motion-stage')!.getBoundingClientRect();
        const previous = pointerSample.current;
        const dt = now - previous.time;
        const speed =
          dt > 0 && dt < 150
            ? Math.hypot(event.clientX - previous.x, event.clientY - previous.y) / dt
            : 0;
        pointerSample.current = { x: event.clientX, y: event.clientY, time: now };
        const near =
          event.clientX > rect.left &&
          event.clientX < rect.right &&
          event.clientY > rect.top &&
          event.clientY < rect.bottom;
        if (speed > 2.5 && near && now - lastAmbient.current > 14000 && !speakingRef.current) {
          lastAmbient.current = now;
          setAmbient('startle');
          return;
        }
        const dx = gsap.utils.clamp(
          -1,
          1,
          (event.clientX - rect.left - rect.width / 2) / (innerWidth * 0.28)
        );
        const dy = gsap.utils.clamp(
          -1,
          1,
          (event.clientY - rect.top - rect.height / 2) / (innerHeight * 0.3)
        );
        edgeGaze.current = Math.abs(dx) > 0.75;
        x(dx);
        y(dy);
        window.clearTimeout(restTimer);
        restTimer = window.setTimeout(() => {
          x(0);
          y(0);
          restTimer = window.setTimeout(
            () => setGaze((previous) => ({ ...previous, active: false })),
            450
          );
        }, 2800);
      };
      sync = () => {
        breath.paused(!visible || document.hidden);
      };
    }, root);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    window.addEventListener('pointermove', follow, { passive: true });
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      window.clearTimeout(restTimer);
      window.removeEventListener('pointermove', follow);
      document.removeEventListener('visibilitychange', sync);
      ctx.revert();
    };
  }, [reduced, cameo]);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const rig = '.resident-rig';
      gsap.to(rig, {
        rotation: action === 'shy' ? -1.2 : 0,
        y: 0,
        scale: 1,
        scaleY: 1,
        duration: 0.35,
        overwrite: 'auto',
      });
    }, root);
    return () => ctx.revert();
  }, [action, reduced]);

  const hover = (active: boolean) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(
      () => {
        if (busy.current && !shy && active) return;
        if (faceHovered.current === active) return;
        faceHovered.current = active;
        if (active) setGreetingActive(false);
        if (active) setAmbient(null);
        setShy(active);
        onFaceHoverChange?.(active);
      },
      active ? 140 : 100
    );
  };
  return (
    <div
      ref={root}
      className={`hidden-resident resident-face resident-motion${cameo ? ' resident-cameo' : ''}`}
    >
      <span className="resident-motion-stage resident-breath">
        <span className="resident-rig">
          <span className="resident-attention">
            <ResidentMotionExport
              frameIndex={frameOverride ?? frame}
              mouthFrameIndex={mouthFrame}
              eyeFrameIndices={eyesOverride ?? eyeFrames}
              gaze={cameo || action !== 'idle' ? undefined : gaze}
            />
            <span className="resident-mouth" aria-hidden="true" />
            {!cameo && (
              <button
                type="button"
                className="resident-touch resident-face-hit hoverable"
                onPointerEnter={() => hover(true)}
                onPointerLeave={() => hover(false)}
                onFocus={() => hover(true)}
                onBlur={() => hover(false)}
                onClick={() => {
                  if (action === 'ambient' && ambient === 'sleepy') {
                    wake(true);
                    return;
                  }
                  if (!residentCanInteract(action)) return;
                  window.clearTimeout(hoverTimer.current);
                  // Finish one reaction; repeated/double clicks cannot stack clips.
                  if (ambient === 'startle' || ambient === 'surprised' || ambient === 'notice')
                    return;
                  faceHovered.current = false;
                  setShy(false);
                  setGreetingActive(false);
                  lastAmbient.current = Date.now();
                  setAmbient('startle');
                }}
                aria-label="Say hello to the hidden resident"
              />
            )}
          </span>
        </span>
      </span>
    </div>
  );
};
