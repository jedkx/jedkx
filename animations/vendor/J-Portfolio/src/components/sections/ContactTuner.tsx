import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const randomFrequency = () => {
  let previous = -1;
  try {
    previous = Number(sessionStorage.getItem('receiver-last-frequency'));
  } catch {
    /* Optional history. */
  }
  const choices = Array.from({ length: 77 }, (_, index) => index + 12).filter(
    (value) => Math.abs(value - 28) > 6 && value !== previous
  );
  const value = choices[crypto.getRandomValues(new Uint32Array(1))[0] % choices.length];
  try {
    sessionStorage.setItem('receiver-last-frequency', String(value));
  } catch {
    /* Randomization still works. */
  }
  return value;
};

// A local, silent interaction — it never gates the actual contact links.
export const ContactTuner: React.FC<{
  reduced: boolean;
  onLock: (locked: boolean) => void;
}> = ({ reduced, onLock }) => {
  const [value, setValue] = useState(28);
  const [frequency] = useState(randomFrequency);
  const path = useRef<SVGPathElement>(null);
  const dial = useRef({ value: 28 });
  const locked = Math.abs(value - frequency) <= 3;
  const reception = Math.max(0, 1 - Math.abs(value - frequency) / 45);

  useLayoutEffect(() => {
    const draw = () => {
      const position = dial.current.value;
      const noise = Math.min(1, Math.abs(position - frequency) / 35);
      const points = Array.from({ length: 161 }, (_, index) => {
        const x = index * 2;
        const envelope = Math.sin((index / 160) * Math.PI);
        const carrier = Math.sin(index * 0.16 + position * 0.08) * 15;
        const interference = Math.sin(index * 0.87 + position * 0.4) * noise * 19;
        return `${index ? 'L' : 'M'}${x.toFixed(1)},${(32 + (carrier + interference) * envelope).toFixed(1)}`;
      });
      path.current?.setAttribute('d', points.join(' '));
    };
    if (reduced) {
      dial.current.value = value;
      draw();
      return;
    }
    const tween = gsap.to(dial.current, {
      value,
      duration: locked ? 0.8 : 0.35,
      ease: locked ? 'elastic.out(1, 0.5)' : 'power2.out',
      onUpdate: draw,
    });
    draw();
    return () => {
      tween.kill();
    };
  }, [value, reduced, locked, frequency]);

  const tune = (next: number) => {
    setValue(next);
    onLock(Math.abs(next - frequency) <= 3);
  };
  const settle = () => {
    if (locked) tune(frequency);
  };

  return (
    <div className={`contact-tuner${locked ? ' is-locked' : ''}`}>
      <div className="contact-tuner-readout">
        <label htmlFor="contact-frequency">FIND THE SIGNAL</label>
        <span aria-hidden="true">
          {(88 + value * 0.2).toFixed(1)} <small>MHz</small>
        </span>
      </div>
      <div className="contact-tuner-scope" aria-hidden="true">
        <svg viewBox="0 0 320 64" preserveAspectRatio="none" fill="none">
          <path className="contact-tuner-grid" d="M0 32H320 M80 0V64 M160 0V64 M240 0V64" />
          <path ref={path} className="contact-tuner-wave" />
        </svg>
      </div>
      <div className="receiver-strength" aria-hidden="true">
        <span>{locked ? 'CHANNEL OPEN' : reception > 0.7 ? 'CARRIER DETECTED' : 'SEARCHING'}</span>
        <div>
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} className={index < Math.round(reception * 12) ? 'is-lit' : ''} />
          ))}
        </div>
      </div>
      <input
        id="contact-frequency"
        className="contact-tuner-slider hoverable"
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => tune(Number(event.target.value))}
        onPointerUp={settle}
        aria-describedby="contact-frequency-help"
        aria-valuetext={`${(88 + value * 0.2).toFixed(1)} megahertz${locked ? ', signal locked' : ''}`}
      />
      <div className="contact-tuner-caption" id="contact-frequency-help">
        <span aria-live="polite">
          {locked
            ? 'SIGNAL LOCKED ↗'
            : reception > 0.7
              ? 'HOLD STEADY · ALMOST THERE'
              : 'SLIDE · FIND A CLEAN FREQUENCY'}
        </span>
        <span aria-hidden="true">{locked ? '●' : '○'}</span>
      </div>
    </div>
  );
};
