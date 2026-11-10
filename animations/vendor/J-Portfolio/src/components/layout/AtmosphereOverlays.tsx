// ============================================
// ATMOSPHERE OVERLAYS - Scanlines, Noise, Vignette
// ============================================

import React from 'react';

export const AtmosphereOverlays: React.FC = () => {
  return (
    <>
      {/* Scanlines */}
      <div className="scanlines" aria-hidden="true" />
      
      {/* Noise texture */}
      <div className="noise" aria-hidden="true" />
      
      {/* Vignette */}
      <div className="vignette" aria-hidden="true" />
    </>
  );
};
