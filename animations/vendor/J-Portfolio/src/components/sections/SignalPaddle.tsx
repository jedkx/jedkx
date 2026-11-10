import { useLayoutEffect, useRef, useState } from 'react';
import { useVisibleAnimationFrame } from '@/hooks/useVisibleAnimationFrame';
import { createRun, stepRun, paddleWidth, runDifficulty, RADAR_SCORE } from '@/lib/signalRun';

function readBest() {
  try {
    const value = Number(localStorage.getItem('signal-run-best'));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}
export function SignalPaddle({
  onUnlock,
  connected,
  reduced = false,
}: {
  onUnlock: () => void;
  connected: boolean;
  reduced?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef(createRun()),
    paddle = useRef(240),
    target = useRef(240);
  const ink = useRef('#ff5555'),
    keys = useRef({ left: false, right: false });
  const trail = useRef<{ x: number; y: number }[]>([]);
  const sparks = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const earned = useRef(connected);
  const [running, setRunning] = useState(false),
    [played, setPlayed] = useState(false);
  const [hud, setHud] = useState({ score: 0, speed: 1, bonus: '' }),
    [best, setBest] = useState(readBest);
  const [paused, setPaused] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useLayoutEffect(() => {
    if (!canvas.current?.getContext('2d')) setUnavailable(true);
  }, []);
  const draw = () => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const g = game.current;
    const scale = canvas.current!.width / 480;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, 480, 300);
    ctx.fillStyle = '#090909';
    ctx.fillRect(0, 0, 480, 300);
    ctx.strokeStyle = '#ffffff0b';
    ctx.lineWidth = 1;
    for (let y = 20; y < 300; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y + ((g.elapsed * 0.007) % 30));
      ctx.lineTo(480, y + ((g.elapsed * 0.007) % 30));
      ctx.stroke();
    }
    g.blocks.forEach((block) => {
      ctx.fillStyle = block.hp > 1 ? '#ddd' : ink.current;
      ctx.globalAlpha = block.hp > 1 ? 0.7 : 0.5;
      ctx.fillRect(block.x, block.y, 64, 14);
      if (block.hp > 1) {
        ctx.fillStyle = '#090909';
        ctx.fillRect(block.x + 3, block.y + 3, 58, 8);
      }
      ctx.globalAlpha = 1;
    });
    g.drops.forEach((drop) => {
      ctx.strokeStyle = ink.current;
      ctx.strokeRect(drop.x - 9, drop.y - 9, 18, 18);
      ctx.fillStyle = '#eee';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        drop.kind === 'wide' ? 'W' : drop.kind === 'shield' ? 'S' : '↓',
        drop.x,
        drop.y + 4
      );
    });
    trail.current.forEach((point, index) => {
      ctx.fillStyle = `rgba(240,240,240,${(index / Math.max(1, trail.current.length)) * 0.25})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    sparks.current.forEach((spark) => {
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = ink.current;
      ctx.fillRect(spark.x, spark.y, 2, 2);
      ctx.globalAlpha = 1;
    });
    if (g.shield) {
      ctx.strokeStyle = ink.current;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, 295);
      ctx.lineTo(480, 295);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const width = paddleWidth(g);
    ctx.fillStyle = '#eeeeee';
    ctx.shadowColor = ink.current;
    ctx.shadowBlur = reduced ? 0 : 12;
    ctx.fillRect(paddle.current - width / 2, 275, width, 4);
    ctx.fillStyle = ink.current;
    ctx.beginPath();
    ctx.arc(g.ball.x, g.ball.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (!running || paused) {
      ctx.fillStyle = '#090909c9';
      ctx.fillRect(0, 0, 480, 300);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#eee';
      ctx.font = '20px monospace';
      ctx.fillText(paused ? 'PAUSED' : played ? 'TAP TO TRY AGAIN' : 'TAP TO PLAY', 240, 135);
      ctx.fillStyle = '#aaa';
      ctx.font = '12px monospace';
      ctx.fillText(
        paused
          ? 'Tap to resume. Space pauses.'
          : played
            ? `${g.score} points · One more run?`
            : 'Move the paddle. Push back the noise.',
        240,
        161
      );
    }
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useLayoutEffect(() => {
    draw();
  });
  useLayoutEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const resize = () => {
      const ratio = Math.min(
        devicePixelRatio || 1,
        document.documentElement.dataset.renderQuality === 'low' ? 1 : 1.5
      );
      const width = Math.max(1, Math.round(node.getBoundingClientRect().width * ratio));
      node.width = width;
      node.height = Math.max(1, Math.round((width * 300) / 480));
      drawRef.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    return () => observer.disconnect();
  }, []);
  useVisibleAnimationFrame(root, !running || paused, (delta) => {
    const g = game.current;
    if (keys.current.left) target.current -= delta * 0.44;
    if (keys.current.right) target.current += delta * 0.44;
    const half = paddleWidth(g) / 2;
    target.current = Math.max(half, Math.min(480 - half, target.current));
    paddle.current += (target.current - paddle.current) * (1 - Math.exp(-delta / 40));
    const events = stepRun(g, paddle.current, delta);
    if (!reduced) {
      trail.current.push({ x: g.ball.x, y: g.ball.y });
      if (trail.current.length > 14) trail.current.shift();
    }
    events.forEach((event) => {
      if (reduced) return;
      for (let i = 0; i < 6; i++)
        sparks.current.push({
          x: event.x,
          y: event.y,
          vx: Math.cos((i * Math.PI) / 3) * 0.12,
          vy: Math.sin((i * Math.PI) / 3) * 0.12,
          life: 1,
        });
    });
    sparks.current = sparks.current
      .filter((spark) => {
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;
        spark.life -= delta / 350;
        return spark.life > 0;
      })
      .slice(-80);
    const score = g.score,
      speed = Number((1 + runDifficulty(g.elapsed) * 1.44).toFixed(1));
    const bonus =
      g.wideUntil > g.elapsed
        ? 'WIDE PADDLE'
        : g.slowUntil > g.elapsed
          ? 'SLOW MOTION'
          : g.shield
            ? 'SHIELD'
            : '';
    if (score !== hud.score || speed !== hud.speed || bonus !== hud.bonus)
      setHud({ score, speed, bonus });
    if (score >= RADAR_SCORE && !earned.current) {
      earned.current = true;
      onUnlock();
    }
    if (g.over) {
      setRunning(false);
      if (score > best) {
        setBest(score);
        try {
          localStorage.setItem('signal-run-best', String(score));
        } catch {
          /* Optional. */
        }
      }
    }
    draw();
  });
  const start = () => {
    if (paused) {
      setPaused(false);
      canvas.current?.focus({ preventScroll: true });
      return;
    }
    game.current = createRun(crypto.getRandomValues(new Uint32Array(1))[0]);
    paddle.current = 240;
    target.current = 240;
    trail.current = [];
    sparks.current = [];
    ink.current =
      getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() ||
      '#ff5555';
    setHud({ score: 0, speed: 1, bonus: '' });
    setPlayed(true);
    setRunning(true);
    canvas.current?.focus({ preventScroll: true });
  };
  const aim = (x: number) => {
    const rect = canvas.current!.getBoundingClientRect();
    target.current = ((x - rect.left) / rect.width) * 480;
  };
  if (unavailable)
    return (
      <div ref={root} className="run-game-placeholder">
        <p>The game couldn’t start.</p>
        <button type="button" onClick={onUnlock}>
          Open radar ↗
        </button>
      </div>
    );
  return (
    <div ref={root} className="signal-paddle signal-run" data-secret-ui>
      <div className="play-register">
        <span>SIGNAL RUN</span>
        <span>
          {hud.bonus || `${hud.speed.toFixed(1)}×`} · {hud.score} <small> / BEST {best}</small>
        </span>
      </div>
      <canvas
        ref={canvas}
        width={960}
        height={600}
        tabIndex={0}
        role="button"
        className="hoverable"
        data-state={!running ? 'idle' : paused ? 'paused' : 'playing'}
        aria-label="Signal Run. Click, tap or press Enter to play. Move with the pointer, drag or arrow keys. Space pauses. Reach 100 points to unlock the radar."
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          aim(event.clientX);
          event.currentTarget.setPointerCapture(event.pointerId);
          if (!running || paused) start();
          else event.currentTarget.focus({ preventScroll: true });
        }}
        onPointerMove={(event) => aim(event.clientX)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            keys.current[event.key === 'ArrowLeft' ? 'left' : 'right'] = true;
          } else if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
            event.preventDefault();
            if (!running) start();
            else setPaused((value) => !value);
          }
        }}
        onKeyUp={(event) => {
          if (event.key === 'ArrowLeft') keys.current.left = false;
          if (event.key === 'ArrowRight') keys.current.right = false;
        }}
        onBlur={() => {
          keys.current = { left: false, right: false };
        }}
      />
      <div className="signal-paddle-bottom">
        <p role="status">
          {connected || earned.current
            ? 'Radar unlocked. Keep going.'
            : `${hud.score} / ${RADAR_SCORE} to unlock the radar.`}
        </p>
        {running && (
          <button
            type="button"
            className="hoverable"
            onClick={() => {
              if (running && !paused) setPaused(true);
              else start();
            }}
          >
            {paused ? 'Resume ↗' : 'Pause'}
          </button>
        )}
      </div>
    </div>
  );
}
