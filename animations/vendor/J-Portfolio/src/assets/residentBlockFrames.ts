// Editable ASCII Motion expression sheet. Only block cells form the eyes/mouth.
const WIDTH = 34;
const HEIGHT = 12;
type Sprite = string[];
const OPEN: Sprite = [' ▄████▄ ', '███  ███', '███  ███', ' ▀████▀ '];
const LEFT: Sprite = [' ▄████▄ ', '██  ████', '██  ████', ' ▀████▀ '];
const RIGHT: Sprite = [' ▄████▄ ', '████  ██', '████  ██', ' ▀████▀ '];
const HALF: Sprite = ['        ', '▄▄▄▄▄▄▄▄', '▀██  ██▀', '        '];
const CLOSED: Sprite = ['        ', '        ', '▄▄▄▄▄▄▄▄', '        '];
const HAPPY: Sprite = ['        ', ' ▄████▄ ', '██▀  ▀██', '        '];
const WIDE: Sprite = [' ▄████▄ ', '██    ██', '██    ██', ' ▀████▀ '];
const SMILE: Sprite = ['▄      ▄', ' ▀▄▄▄▄▀ '];
const SMALL: Sprite = ['        ', '  ▄▄▄▄  '];
const MOUTH_OPEN: Sprite = [' ▄████▄ ', '████████', ' ▀████▀ '];
const CHEW: Sprite = ['        ', ' ▄▄▄▄▄▄ '];

const pose = (left: Sprite, right: Sprite, mouth: Sprite): string[] => {
  const grid = Array.from({ length: HEIGHT }, () => Array<string>(WIDTH).fill(' '));
  const stamp = (sprite: Sprite, x: number, y: number) =>
    sprite.forEach((line, row) => {
      Array.from(line).forEach((char, col) => {
        if (char !== ' ') grid[y + row][x + col] = char;
      });
    });
  stamp(left, 3, 3);
  stamp(right, 23, 3);
  stamp(mouth, 13, 8);
  return grid.map((row) => row.join(''));
};

export const residentCanvas = { width: WIDTH, height: HEIGHT };
export const residentFrames = [
  { duration: 1400, lines: pose(OPEN, OPEN, SMILE) },
  { duration: 55, lines: pose(HALF, OPEN, SMILE) },
  { duration: 85, lines: pose(CLOSED, CLOSED, SMILE) },
  { duration: 65, lines: pose(OPEN, HALF, SMILE) },
  { duration: 1100, lines: pose(OPEN, OPEN, SMILE) },
  { duration: 420, lines: pose(LEFT, LEFT, SMALL) },
  { duration: 420, lines: pose(RIGHT, RIGHT, SMALL) },
  { duration: 240, lines: pose(WIDE, WIDE, SMALL) },
  { duration: 450, lines: pose(HAPPY, HAPPY, SMALL) },
  { duration: 180, lines: pose(WIDE, WIDE, MOUTH_OPEN) },
  { duration: 115, lines: pose(HAPPY, HAPPY, CHEW) },
  { duration: 200, lines: pose(CLOSED, CLOSED, SMALL) },
  { duration: 650, lines: pose(HAPPY, HAPPY, SMILE) },
  { duration: 130, lines: pose(OPEN, CLOSED, SMILE) },
];

export interface ResidentGaze {
  x: number;
  y: number;
  active: boolean;
}

// Two-by-two block quadrants move only the black pupils, leaving the eye rims
// and asynchronous blink silhouettes exactly as authored in ASCII Motion.
const QUADRANTS = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█'];
const trackEye = (gaze: ResidentGaze): Sprite => {
  const pixels = Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      const char = OPEN[Math.floor(y / 2)][Math.floor(x / 2)];
      const bits = QUADRANTS.indexOf(char);
      return Boolean(bits & (1 << ((y % 2) * 2 + (x % 2))));
    })
  );
  for (let y = 2; y < 6; y++) for (let x = 6; x < 10; x++) pixels[y][x] = true;
  const clamp = (value: number) => (Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0);
  // Keep a white pixel around the pupil, including at diagonal extremes.
  // The rounded silhouette narrows on its top/bottom rows.
  const top = 2 + Math.round(clamp(gaze.y));
  // A fixed safe range avoids the sideways jump when the vertical gaze crosses
  // a half-pixel threshold. Both diagonals retain the same pupil shape.
  const horizontalRange = 1;
  const left = 6 + Math.round(clamp(gaze.x) * horizontalRange);
  for (let y = top; y < top + 4; y++) for (let x = left; x < left + 4; x++) pixels[y][x] = false;
  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => {
      let bits = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++)
          if (pixels[row * 2 + dy][col * 2 + dx]) bits |= 1 << (dy * 2 + dx);
      return QUADRANTS[bits];
    }).join('')
  );
};

export const trackedResidentLines = (index: number, gaze?: ResidentGaze): string[] => {
  const frame = residentFrames[index] ?? residentFrames[0];
  if (!gaze?.active) return frame.lines;
  const bothOpen = [0, 4, 5, 6].includes(index);
  const eyes = bothOpen ? [3, 23] : index === 1 ? [23] : [3, 13].includes(index) ? [3] : [];
  if (!eyes.length) return frame.lines;
  const lines = frame.lines.map((line) => Array.from(line));
  const sprite = trackEye(gaze);
  eyes.forEach((left) =>
    sprite.forEach((line, row) =>
      Array.from(line).forEach((char, col) => {
        lines[row + 3][left + col] = char;
      })
    )
  );
  return lines.map((line) => line.join(''));
};
