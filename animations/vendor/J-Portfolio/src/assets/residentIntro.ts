import { residentBlink, residentFrames } from './residentAnimation';

// One clock owns the intro, including the face. No competing React clip timers.
export const residentIntro = {
  split: 1.5,
  awake: 2.6,
  prepare: 3.55,
  lift: 3.95,
  arrive: 4.65,
  consume: 4.85,
  close: 7.1,
  closed: 7.75,
  ready: 9.9,
  reveal: 10.35,
};

export const residentIntroBlinks = (() => {
  let at = residentIntro.awake;
  return residentBlink.map(([left, right, duration]) => {
    const cue = { at, eyes: [left, right] as const };
    at += (duration * 1.3) / 1000;
    return cue;
  });
})();

export const residentIntroPoses = (() => {
  const cues = [
    { at: 0, frame: 0 },
    { at: residentIntro.prepare, frame: 26 },
    { at: 3.85, frame: 28 },
    { at: 4.05, frame: 29 },
  ];
  let at = residentIntro.consume;
  for (const frame of [30, 31, 32, 33, 34, 35, 36, 37, 38]) {
    cues.push({ at, frame });
    at += residentFrames[frame].duration / (frame <= 35 ? 0.85 : 1) / 1000;
  }
  return cues;
})();
