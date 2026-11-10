import React from 'react';

// One six-line outline alphabet for both the full name and the terminal monogram.
const glyphs: Record<string, string[]> = {
  C: ['  _____ ', ' / ____|', '| |     ', '| |     ', '| |____ ', ' \\_____|'],
  A: ['   /\\   ', '  /  \\  ', ' / /\\ \\ ', '/ ____ \\', '/_/  \\_\\', '        '],
  N: [' _   _  ', '| \\ | | ', '|  \\| | ', '| . ` | ', '| |\\  | ', '|_| \\_| '],
  E: [' ______ ', '|  ____|', '| |__   ', '|  __|  ', '| |____ ', '|______|'],
  R: [' _____  ', '|  __ \\ ', '| |__) |', '|  _  / ', '| | \\ \\ ', '|_|  \\_\\'],
  O: ['  ____  ', ' / __ \\ ', '| |  | |', '| |  | |', '| |__| |', ' \\____/ '],
  S: ['  _____ ', ' / ____|', '| (___  ', ' \\___ \\ ', ' ____) |', '|_____/ '],
  K: [' _  __  ', '| |/ /  ', "| ' /   ", '|  <    ', '| . \\   ', '|_|\\_\\  '],
  U: [' _    _ ', '| |  | |', '| |  | |', '| |  | |', '| |__| |', ' \\____/ '],
};
export const asciiGlyph = (letter: string) => {
  const base = letter === 'Ş' ? 'S' : letter.toUpperCase();
  return [
    ...(glyphs[base] ?? Array(6).fill('        ')),
    letter === 'Ş' ? '    ,   ' : '        ',
  ].join('\n');
};
export const AsciiWord: React.FC<{ word: string }> = ({ word }) => (
  <span className="ascii-word word-ascii" aria-hidden="true">
    {Array.from(word).map((letter, index) => (
      <span className="ascii-glyph" key={index}>
        {asciiGlyph(letter)}
      </span>
    ))}
  </span>
);
