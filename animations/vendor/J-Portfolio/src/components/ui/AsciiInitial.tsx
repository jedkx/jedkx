import React from 'react';
import { asciiGlyph } from './AsciiWord';

const GLYPH = asciiGlyph('C');

// The title and terminal share the same glyph, so the scroll handoff is literal.
export const AsciiInitial: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`ascii-initial ${className}`} aria-hidden="true">
    {GLYPH}
  </span>
);
