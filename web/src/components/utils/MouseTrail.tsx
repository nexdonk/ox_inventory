import React, { useEffect, useRef, useState } from 'react';
import { useNexConfig } from '../../hooks/useNexConfig';
import useNuiEvent from '../../hooks/useNuiEvent';

const MAX_POINTS = 28;
// How long (ms) a point lives before it's fully invisible & dropped.
// Mouse stops → trail finishes fading in ~LIFETIME.
const LIFETIME = 380;

interface Point { x: number; y: number; t: number; }

const MouseTrail: React.FC = () => {
  const { mouseTrail } = useNexConfig();
  const [visible, setVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const rafRef = useRef<number | null>(null);

  // Mirror the inventory's visibility — trail only runs while it's open
  useNuiEvent<boolean>('setInventoryVisible', setVisible);
  useNuiEvent<false>('closeInventory', () => setVisible(false));
  useNuiEvent<{ leftInventory?: unknown; rightInventory?: unknown }>('setupInventory', () => setVisible(true));

  const active = !!mouseTrail?.enabled && visible;

  useEffect(() => {
    if (!active) {
      // Wipe any lingering trail and stop the loop
      pointsRef.current = [];
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const rgb = mouseTrail?.color
      ? `${mouseTrail.color.r},${mouseTrail.color.g},${mouseTrail.color.b}`
      : '255,255,255';

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();

      // Drop expired points so a stationary mouse fades to nothing.
      const pts = pointsRef.current;
      while (pts.length && now - pts[0].t > LIFETIME) pts.shift();

      if (pts.length > 1) {
        // Glow is faked by drawing a wider, softer underlay stroke before
        // the crisp top stroke. Canvas shadowBlur is GPU-bound and tanks
        // CEF perf — two extra strokes are far cheaper than per-frame blur.
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < pts.length; i++) {
            const p0 = pts[i - 1];
            const p1 = pts[i];
            const life = 1 - (now - p1.t) / LIFETIME;
            if (life <= 0) continue;
            const alpha = life * life;
            const w = 0.5 + life * 4.5;
            ctx.beginPath();
            if (pass === 0) {
              ctx.strokeStyle = `rgba(${rgb},${alpha * 0.35})`;
              ctx.lineWidth = w + 4 * life;
            } else {
              ctx.strokeStyle = `rgba(${rgb},${alpha})`;
              ctx.lineWidth = w;
            }
            ctx.lineCap = 'round';
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
        }
      }

      // Idle-pause: nothing visible, no need to keep ticking.
      if (pts.length === 0) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (pointsRef.current.length > MAX_POINTS) pointsRef.current.shift();
      // Wake the RAF loop if it's idle.
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);

    // Tab-out / minimise / window blur → clear the trail so it doesn't
    // persist when the player comes back to the game.
    const clearTrail = () => {
      pointsRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    const onVisibility = () => { if (document.hidden) clearTrail(); };
    window.addEventListener('blur', clearTrail);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('blur', clearTrail);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pointsRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, mouseTrail?.color?.r, mouseTrail?.color?.g, mouseTrail?.color?.b]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default MouseTrail;
