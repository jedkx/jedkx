import React, { useEffect, useRef, useState } from 'react';
import leftUrl from '../../art/resident/eye-left.png';
import rightUrl from '../../art/resident/eye-right.png';
import mouthUrl from '../../art/resident/mouth.png';
import leftData from '../../art/resident/eye-left.json';
import rightData from '../../art/resident/eye-right.json';
import mouthData from '../../art/resident/mouth.json';
import {
  residentFrames,
  residentPupil,
  residentEatingEyes,
  residentTracking,
  type ResidentGaze,
} from './residentAnimation';

const atlases = [leftData, rightData, mouthData].map((data) => Object.values(data.frames));
let loaded: Promise<HTMLImageElement[]> | undefined;
const loadImages = () =>
  (loaded ??= Promise.all(
    [leftUrl, rightUrl, mouthUrl].map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Resident atlas failed to load'));
          image.src = src;
        })
    )
  ));
const widths = [6, 10, 12, 14, 16, 16, 16, 16, 16, 16, 14, 12, 10, 6];

/** Aseprite supplies artwork; Canvas composites clips and alpha-cutout gaze. */
export const ResidentMotionExport: React.FC<{
  frameIndex?: number;
  mouthFrameIndex?: number;
  eyeFrameIndices?: readonly [number, number];
  gaze?: ResidentGaze;
}> = ({ frameIndex = 0, mouthFrameIndex, eyeFrameIndices, gaze }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  useEffect(() => {
    let active = true;
    loadImages()
      .then((result) => {
        if (active) setImages(result);
      })
      .catch(() => {
        loaded = undefined;
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || images.length !== 3) return;
    ctx.setTransform(4, 0, 0, 4, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 68, 40);
    const eyes = eyeFrameIndices ?? residentEatingEyes(frameIndex);
    for (let layer = 0; layer < 3; layer++) {
      const index = layer === 2 ? (mouthFrameIndex ?? frameIndex) : (eyes?.[layer] ?? frameIndex);
      const { frame } = atlases[layer][index] ?? atlases[layer][0];
      ctx.drawImage(images[layer], frame.x, frame.y, frame.w, frame.h, 0, 0, 68, 40);
      const tracking = layer === 0 ? residentTracking.left : residentTracking.right;
      if (layer < 2 && gaze?.active && tracking.includes(index)) {
        const x = layer === 0 ? 6 : 46;
        ctx.fillStyle = '#f4f4f4';
        widths.forEach((width, row) => ctx.fillRect(x + (16 - width) / 2, 10 + row, width, 1));
        const pupil = residentPupil(gaze);
        // Alpha removal, never a black rectangle: the background remains visible.
        ctx.clearRect(x + pupil.x, 10 + pupil.y, pupil.width, pupil.height);
      }
    }
  }, [images, frameIndex, mouthFrameIndex, eyeFrameIndices, gaze]);
  return (
    <canvas
      ref={canvas}
      width={272}
      height={160}
      className="resident-motion-frame resident-block-grid"
      aria-hidden="true"
      data-resident-frame={Math.min(frameIndex, residentFrames.length - 1)}
    />
  );
};
