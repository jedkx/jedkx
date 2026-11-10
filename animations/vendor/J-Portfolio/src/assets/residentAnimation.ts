import atlas from '../../art/resident/sheet.json';
import animation from '../../art/resident/animation.json';

export type ResidentClip = keyof typeof animation.clips;
export interface ResidentGaze {
  x: number;
  y: number;
  active: boolean;
}
export const residentFrames = Object.values(atlas.frames);
export const residentClips = animation.clips;
export const residentTracking = animation.tracking;
export const residentCanvas = animation.canvas;

// Eating owns the mouth; avoid swapping eye silhouettes/pupils on every chew.
export const residentEatingEyes = (frame: number): readonly [number, number] | undefined =>
  frame >= 26 && frame <= 38 ? [0, 0] : undefined;

export type ResidentAction =
  | 'sleep'
  | 'farewell'
  | 'eat'
  | 'prepare'
  | 'recover'
  | 'shy'
  | 'greet'
  | 'ambient'
  | 'idle';

export const residentCanInteract = (action: ResidentAction) =>
  action === 'idle' || action === 'shy' || action === 'greet' || action === 'ambient';
export const residentAction = (state: {
  awake: boolean;
  departing: boolean;
  eating: boolean;
  anticipating: boolean;
  recovering: boolean;
  shy: boolean;
  greeting: boolean;
  ambient?: boolean;
}): ResidentAction =>
  !state.awake
    ? 'sleep'
    : state.departing
      ? 'farewell'
      : state.eating
        ? 'eat'
        : state.anticipating
          ? 'prepare'
          : state.recovering
            ? 'recover'
            : state.shy
              ? 'shy'
              : state.greeting
                ? 'greet'
                : state.ambient
                  ? 'ambient'
                  : 'idle';

export const residentIdleCue = (
  quietMs: number,
  cooldownMs: number,
  speaking: boolean,
  edgeGaze: boolean
): ResidentClip | null => {
  if (speaking || cooldownMs < 14000) return null;
  if (quietMs >= 22000) return 'sleepy';
  if (quietMs >= 6500) return 'search';
  if (quietMs >= 1200 && edgeGaze) return 'curious';
  return null;
};

export const residentCanWake = (heldMs: number, movedPx: number, deliberate = false) =>
  heldMs >= (deliberate ? 1800 : 6000) && (deliberate || movedPx >= 80);

export const residentReactionLines = {
  sleepy: ['Just resting my eyes...', 'It’s quiet here. Maybe a little nap.'],
  wake: ['Mm... oh. You’re still here.', 'Oh... hi. Did I fall asleep?'],
  search: ['Where did you go?', 'Still there? I lost you for a second.'],
  curious: ['What’s over there?', 'You found something interesting?'],
  startle: ['Oh! You surprised me.', 'Ah—just you. That was quick.'],
  surprised: ['Twice? Okay, you have my attention.', 'Oh. You really wanted to say hello.'],
} as const;
export type ResidentReaction = keyof typeof residentReactionLines;

// Frog-like stagger: the second lid starts before the first has finished opening.
// Each tuple is left frame, right frame, duration; never both fully shut together.
export const residentBlink: readonly (readonly [number, number, number])[] = [
  [1, 0, 65],
  [2, 0, 85],
  [2, 6, 55],
  [1, 7, 75],
  [0, 7, 115],
  [0, 6, 85],
  [0, 0, 80],
];

/** Stylized text acting, not phonetic/audio lip-sync. One pose per word. */
export const residentSpeechFrame = (text: string): number => {
  if (!text || /[\s.,!?…:;]$/.test(text)) return 51;
  const word = text.match(/[a-z’']+$/i)?.[0]?.toLowerCase() ?? '';
  if (!word) return 51;
  if (/[ou]/.test(word)) return 52;
  if (/[ae]/.test(word)) return 53;
  if (/[iy]/.test(word)) return 54;
  return 56;
};

export const residentSpokenWord = (message: string, typed: string): string => {
  if (!typed || /[\s.,!?…:;]$/.test(typed)) return '';
  const start = typed.search(/[a-z’']+$/i);
  return start < 0 ? '' : (message.slice(start).match(/^[a-z’']+/i)?.[0] ?? '');
};

export const clipFrames = (name: ResidentClip) => {
  const { from, to } = residentClips[name];
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
};

/** Clamp pointer input; preserve a white rim even at diagonal extremes. */
export const residentPupil = (gaze: ResidentGaze) => {
  const clamp = (v: number) => (Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
  return {
    x: 6 + Math.round(clamp(gaze.x) * 8) / 4,
    y: 4 + Math.round(clamp(gaze.y) * 4) / 4,
    width: 4,
    height: 7,
  };
};
