import React, { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks';
import { particleCharge, particleColor } from '@/lib/particleColor';
import { RenderBudget } from '@/lib/renderBudget';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  phase: number;
  alpha: number;
  heat: number;
  energy: number;
  fade: number;
}
interface Wave {
  x: number;
  y: number;
  radius: number;
  life: number;
  power: number;
}
const random = (min: number, max: number) => min + Math.random() * (max - min);

// Linear-cost physics; no pairwise particle loops or React state per frame.
export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const stage = canvas.parentElement!;
    const stars: Star[] = [],
      waves: Wave[] = [];
    const pointer = { x: -10000, y: -10000, vx: 0, vy: 0, down: false, start: 0, charge: 0 };
    let width = 0,
      height = 0,
      frame = 0,
      last = performance.now(),
      visible = true;
    let accentRgb = [255, 85, 85];
    const budget = new RenderBudget();
    budget.quality =
      document.documentElement.dataset.renderQuality === 'low'
        ? 0
        : document.documentElement.dataset.renderQuality === 'balanced'
          ? 1
          : 2;
    let previousFrame = 0;
    let temperatures: number[][] = [];
    const temperatureColor = (heat: number, energy = 1) =>
      particleColor(temperatures, heat, energy);
    const playing = () => !reduced && stage.dataset.playgroundActive !== 'false';
    const endCursorCharge = () => {
      delete document.body.dataset.heroCharging;
      document.body.style.removeProperty('--cursor-charge');
      document.body.style.removeProperty('--cursor-heat');
    };
    const syncAccent = () => {
      const hex = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-accent')
        .trim();
      if (/^#[a-f\d]{6}$/i.test(hex)) {
        accentRgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      }
      const stops = [accentRgb, [255, 145, 45], [255, 60, 40], [255, 250, 240], [120, 190, 255]];
      temperatures = Array.from({ length: 65 }, (_, step) => {
        const progress = (step / 64) * 4,
          segment = Math.min(3, Math.floor(progress));
        return stops[segment].map((channel, index) =>
          Math.round(channel + (stops[segment + 1][index] - channel) * (progress - segment))
        );
      });
    };
    const makeStar = (): Star => {
      const depth = random(0.25, 1);
      const radius = Math.sqrt(Math.random()) * Math.max(width, height) * 0.48;
      const angle = radius * 0.018 + (Math.random() < 0.5 ? 0 : Math.PI) + random(-0.45, 0.45);
      const clustered = Math.random() < 0.65;
      return {
        x: clustered ? width * 0.5 + Math.cos(angle) * radius : random(0, width),
        y: clustered ? height * 0.5 + Math.sin(angle) * radius * 0.5 : random(0, height),
        vx: -Math.sin(angle) * 0.18,
        vy: Math.cos(angle) * 0.12,
        size: random(0.6, 2.3) * depth,
        depth,
        phase: random(0, Math.PI * 2),
        alpha: random(0.5, 1),
        heat: 0,
        energy: 0,
        fade: 0,
      };
    };
    const resize = () => {
      const oldWidth = width || innerWidth,
        oldHeight = height || innerHeight;
      width = stage.clientWidth || innerWidth;
      height = Math.min(stage.clientHeight || innerHeight, innerHeight);
      const ratio = Math.min(
        devicePixelRatio || 1,
        budget.quality === 2 ? 1.5 : budget.quality === 1 ? 1.25 : 1
      );
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars.forEach((star) => {
        star.x *= width / oldWidth;
        star.y *= height / oldHeight;
      });
      const count = reduced
        ? 130
        : Math.round(
            Math.min(
              width < 768 ? [150, 240, 340][budget.quality] : [280, 600, 1100][budget.quality],
              Math.max(150, (width * height) / 1500)
            )
          );
      while (stars.length < count) stars.push(makeStar());
      stars.length = count;
    };
    const burst = () => {
      if (!pointer.down) return;
      const charge = particleCharge(performance.now(), pointer.start),
        radius = 360 + charge * Math.max(width, height) * 0.75;
      const bounds = canvas.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent('hero-particle-burst', {
          detail: {
            x: bounds.left + pointer.x,
            y: bounds.top + pointer.y,
            charge,
            color: `rgb(${temperatureColor(Math.min(1, charge * 0.85))})`,
          },
        })
      );
      endCursorCharge();
      stars.forEach((star) => {
        const dx = star.x - pointer.x,
          dy = star.y - pointer.y,
          distance = Math.max(8, Math.hypot(dx, dy));
        if (distance < radius) {
          const force =
            (12 + charge * charge * 100) *
            Math.pow(1 - distance / radius, 1.2) *
            (0.5 + star.depth);
          star.vx += (dx / distance) * force;
          star.vy += (dy / distance) * force;
        }
      });
      waves.push({ x: pointer.x, y: pointer.y, radius: 8, life: 1, power: charge });
      if (waves.length > 3) waves.shift();
      pointer.down = false;
      pointer.charge = 0;
    };
    const draw = (now: number, simulate: boolean) => {
      const dt = Math.min(2, Math.max(0.25, (now - last) / 16.667));
      last = now;
      ctx.clearRect(0, 0, width, height);
      if (pointer.down) pointer.charge = particleCharge(now, pointer.start);
      if (pointer.down) {
        document.body.style.setProperty(
          '--cursor-charge',
          String(Math.min(1, pointer.charge / 1.5))
        );
        document.body.style.setProperty(
          '--cursor-heat',
          `rgb(${temperatureColor(Math.min(1, pointer.charge * 0.85))})`
        );
      }
      ctx.globalCompositeOperation = 'lighter';
      let connections = 0;
      for (const star of stars) {
        const dx = pointer.x - star.x,
          dy = pointer.y - star.y,
          distanceSquared = dx * dx + dy * dy;
        const radius = 360 + pointer.charge * Math.max(width, height) * 0.65;
        if (simulate) {
          if (pointer.down && distanceSquared < radius * radius) {
            const distance = Math.max(22, Math.sqrt(distanceSquared));
            const force =
              (0.12 + Math.pow(pointer.charge, 1.4) * 1.4) * (1 - Math.min(1, distance / radius));
            // Tangential acceleration makes an orbit rather than a fixed clump.
            star.vx +=
              ((dx / distance) * force - (dy / distance) * (0.04 + pointer.charge * 0.08)) *
              star.depth *
              dt;
            star.vy +=
              ((dy / distance) * force + (dx / distance) * (0.04 + pointer.charge * 0.08)) *
              star.depth *
              dt;
          } else if (distanceSquared < 135 * 135 && distanceSquared > 1) {
            const distance = Math.sqrt(distanceSquared),
              force = (1 - distance / 135) * 0.3 * star.depth;
            star.vx -= (dx / distance) * force * dt;
            star.vy -= (dy / distance) * force * dt;
            star.vx += pointer.vx * 0.006 * star.depth;
            star.vy += pointer.vy * 0.006 * star.depth;
          }
          star.phase += 0.008 * dt;
          star.vx += Math.cos(star.phase) * 0.003 * dt;
          star.vy += Math.sin(star.phase * 0.8) * 0.003 * dt;
          const speed = Math.hypot(star.vx, star.vy);
          // Momentum survives the release frame; drag slows the burst naturally.
          if (speed > 140) {
            star.vx *= 140 / speed;
            star.vy *= 140 / speed;
          }
          star.x += star.vx * dt;
          star.y += star.vy * dt;
          star.vx *= Math.pow(0.99, dt);
          star.vy *= Math.pow(0.99, dt);
          // Open space: pass through the viewport, never hit or wrap its edges.
          const margin = Math.max(width, height) * 0.8;
          if (
            star.x < -margin ||
            star.x > width + margin ||
            star.y < -margin ||
            star.y > height + margin
          ) {
            Object.assign(star, makeStar(), { fade: 0 });
          }
          star.fade = Math.min(1, star.fade + 0.007 * dt);
          const touched = pointer.down && distanceSquared < radius * radius;
          star.energy += ((touched ? 1 : 0) - star.energy) * (touched ? 0.14 : 0.035) * dt;
          const targetHeat = touched
            ? Math.min(
                1,
                pointer.charge * 0.65 + Math.max(0, Math.hypot(star.vx, star.vy) - 1) / 65
              )
            : 0;
          star.heat += (targetHeat - star.heat) * (targetHeat > star.heat ? 0.045 : 0.018) * dt;
        }
        const fade = reduced ? 1 : star.fade * star.fade * (3 - 2 * star.fade);
        const brightness = star.alpha * fade * (0.9 + 0.1 * Math.sin(star.phase * 3));
        const charged = pointer.down && distanceSquared < radius * radius;
        const color = temperatureColor(star.heat, star.energy);
        ctx.fillStyle = `rgba(${color},${Math.min(1, brightness + (charged ? 0.15 : 0))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size + (charged ? 0.35 : 0), 0, Math.PI * 2);
        ctx.fill();
        if (budget.quality > 0 && (star.size > 1.1 || star.heat > 0.35)) {
          ctx.fillStyle = `rgba(${color},${brightness * 0.12})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * (2.4 + star.heat), 0, Math.PI * 2);
          ctx.fill();
        }
        const speed = Math.hypot(star.vx, star.vy);
        if (simulate && speed > 2.5) {
          ctx.strokeStyle = `rgba(${color},${Math.min(0.7, speed * 0.02) * star.fade})`;
          ctx.lineWidth = Math.max(0.5, star.size * 0.6);
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x - star.vx * 2.2, star.y - star.vy * 2.2);
          ctx.stroke();
        }
        if (charged && connections++ < 35) {
          ctx.strokeStyle = `rgba(${color},${0.04 + pointer.charge * 0.07})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
      if (pointer.down) {
        const radius = 50 + pointer.charge * 180;
        const glow = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          radius
        );
        const coreColor = temperatureColor(Math.min(1, pointer.charge * 0.85));
        glow.addColorStop(0, `rgba(${coreColor},${0.1 + pointer.charge * 0.12})`);
        glow.addColorStop(1, `rgba(${coreColor},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(pointer.x - radius, pointer.y - radius, radius * 2, radius * 2);
      }
      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i];
        if (simulate) {
          wave.radius += (9 + wave.power * 28) * dt;
          wave.life -= 0.016 * dt;
        }
        if (wave.life <= 0) {
          waves.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(${temperatureColor(Math.min(1, wave.power * 0.8))},${wave.life * 0.45})`;
        ctx.lineWidth = wave.life * 1.5;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
      ctx.globalCompositeOperation = 'source-over';
    };
    const animate = (now: number) => {
      frame = 0;
      const started = performance.now();
      draw(now, playing());
      if (previousFrame && budget.sample(performance.now() - started, now - previousFrame)) {
        document.documentElement.dataset.renderQuality = budget.quality === 0 ? 'low' : 'balanced';
        resize();
      }
      previousFrame = now;
      if (visible && !document.hidden && playing()) frame = requestAnimationFrame(animate);
    };
    const updateAnimation = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!playing() || document.hidden || !visible) {
        endCursorCharge();
        pointer.down = false;
        pointer.charge = 0;
      }
      last = performance.now();
      previousFrame = 0;
      if (visible && !document.hidden) {
        draw(last, false);
        if (playing()) frame = requestAnimationFrame(animate);
      }
    };
    const move = (event: PointerEvent) => {
      if (!playing()) return;
      const rect = canvas.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top;
      pointer.vx = Math.abs(pointer.x) > width * 2 ? 0 : Math.max(-40, Math.min(40, x - pointer.x));
      pointer.vy =
        Math.abs(pointer.y) > height * 2 ? 0 : Math.max(-40, Math.min(40, y - pointer.y));
      pointer.x = x;
      pointer.y = y;
    };
    const down = (event: PointerEvent) => {
      if (
        !playing() ||
        event.button !== 0 ||
        (event.target as Element).closest('a,button,input,summary')
      )
        return;
      move(event);
      pointer.down = true;
      pointer.start = performance.now();
      pointer.charge = 0;
      document.body.dataset.heroCharging = 'true';
      document.body.style.setProperty('--cursor-heat', `rgb(${accentRgb.join(',')})`);
    };
    const leave = () => {
      burst();
      pointer.x = -10000;
      pointer.y = -10000;
    };
    const cancel = () => {
      endCursorCharge();
      pointer.down = false;
      pointer.charge = 0;
      pointer.x = -10000;
      pointer.y = -10000;
    };
    const onResize = () => {
      resize();
      updateAnimation();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateAnimation();
    });
    const stateObserver = new MutationObserver(updateAnimation);
    const colorObserver = new MutationObserver(() => {
      syncAccent();
      if (!playing()) updateAnimation();
    });
    resize();
    syncAccent();
    updateAnimation();
    observer.observe(canvas);
    stateObserver.observe(stage, { attributes: true, attributeFilter: ['data-playground-active'] });
    colorObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    stage.addEventListener('pointermove', move, { passive: true });
    stage.addEventListener('pointerdown', down, { passive: true });
    stage.addEventListener('pointerleave', leave, { passive: true });
    window.addEventListener('pointerup', burst, { passive: true });
    window.addEventListener('pointercancel', cancel, { passive: true });
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', updateAnimation);
    return () => {
      endCursorCharge();
      cancelAnimationFrame(frame);
      observer.disconnect();
      stateObserver.disconnect();
      colorObserver.disconnect();
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerdown', down);
      stage.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerup', burst);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', updateAnimation);
    };
  }, [reduced]);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
};
