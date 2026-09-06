'use client';
import { useEffect, useRef } from 'react';

// 2D robot laser scene: the robot artwork as a pointer-reactive background,
// with soft, flowing "smoke" laser beams from the eyes converging on the form
// card. Drop-in replacement for the previous Three.js RobotScene: same props
// ({ mode, verdict }) and the same card contract (a `.laser-card` element that
// may publish `data-laser-status`).

const IMG = '/img/background_inspect2.png';
const IMG_W = 1536;
const IMG_H = 1024;
// Eye centres as a fraction of the artwork (measured from the glowing pupils).
const EYES = [
  { x: 0.6155, y: 0.2643 }, // viewer-left eye
  { x: 0.6893, y: 0.26 }, // viewer-right eye
];

const BG_SCALE = 1.07;
const BG_SHIFT = -16;
const MAX_PARTICLES = 20;

// verdict -> rgb (used on /result via the verdict prop)
const VERDICT_COLORS = {
  malicious: [239, 68, 68],
  suspicious: [245, 158, 11],
  clean: [34, 197, 94],
  loading: [34, 211, 255],
  default: [34, 211, 255],
};
// data-laser-status -> rgb (a card may publish its own state)
const STATUS_COLORS = {
  idle: [34, 211, 255],
  scanning: [255, 196, 64],
  safe: [46, 229, 157],
  suspicious: [255, 176, 40],
  danger: [255, 74, 74],
  error: [255, 108, 60],
};
const DEFAULT_COLOR = [34, 211, 255];

function laserRgbFor(mode, verdict, status) {
  if (status && status in STATUS_COLORS) return STATUS_COLORS[status];
  if (verdict && verdict in VERDICT_COLORS) return VERDICT_COLORS[verdict];
  return DEFAULT_COLOR;
}

export default function RobotScene({ mode = 'inspect', verdict = null }) {
  const mountRef = useRef(null);
  const bgRef = useRef(null);
  const canvasRef = useRef(null);
  const eyeRefs = [useRef(null), useRef(null)];
  const impactRef = useRef(null);

  const modeRef = useRef(mode);
  const verdictRef = useRef(verdict);
  const pointer = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const beamParticles = useRef([[], []]);
  const beamColor = useRef([...DEFAULT_COLOR]);

  useEffect(() => {
    modeRef.current = mode;
    verdictRef.current = verdict;
  }, [mode, verdict]);

  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let canvasW = 0;
    let canvasH = 0;
    let dpr = 1;

    const onMove = (event) => {
      const rect = mount.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.current.x = (event.clientX - rect.left) / rect.width - 0.5;
      pointer.current.y = (event.clientY - rect.top) / rect.height - 0.5;
    };
    window.addEventListener('mousemove', onMove);

    // One beam: a softly undulating light core + thin flowing smoke.
    const drawBeam = (eye, target, particles, phase, time, rgb) => {
      const [r0, g0, b0] = rgb;
      const dx = target.x - eye.x;
      const dy = target.y - eye.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const px = -uy;
      const py = ux;
      const amp = Math.min(9, len * 0.02);

      const offsetAt = (t) => {
        const env = Math.sin(t * Math.PI);
        return (
          env *
          (amp * Math.sin(t * 3 * Math.PI - time * 0.0011 + phase) +
            amp * 0.5 * Math.sin(t * 6 * Math.PI - time * 0.0007 + phase * 1.7))
        );
      };

      const N = 26;
      const pts = [];
      for (let i = 0; i <= N; i += 1) {
        const t = i / N;
        const along = t * len;
        const off = reduceMotion ? 0 : offsetAt(t);
        pts.push([eye.x + ux * along + px * off, eye.y + uy * along + py * off]);
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const tint = (a) => `rgba(${r0},${g0},${b0},${a})`;
      const light = (a) =>
        `rgba(${Math.round((r0 + 510) / 3)},${Math.round((g0 + 510) / 3)},${Math.round(
          (b0 + 510) / 3
        )},${a})`;
      const strokes = [
        { w: 26, color: tint(0.05), blur: 22 },
        { w: 12, color: tint(0.12), blur: 10 },
        { w: 4, color: light(0.5), blur: 6 },
        { w: 1.5, color: 'rgba(255,255,255,0.9)', blur: 3 },
      ];
      strokes.forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.w;
        ctx.shadowColor = tint(0.6);
        ctx.shadowBlur = s.blur;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      if (!reduceMotion) {
        if (particles.length < MAX_PARTICLES && Math.random() < 0.45) {
          particles.push({
            p: Math.random() * 0.05,
            off: (Math.random() - 0.5) * 5,
            drift: (Math.random() - 0.5) * 0.32,
            speed: 0.0015 + Math.random() * 0.0022,
            size0: 4 + Math.random() * 4,
            grow: 14 + Math.random() * 12,
          });
        }
        for (let i = particles.length - 1; i >= 0; i -= 1) {
          const m = particles[i];
          m.p += m.speed;
          m.off += m.drift;
          if (m.p >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const along = m.p * len;
          const lateral = m.off + offsetAt(m.p);
          const x = eye.x + ux * along + px * lateral;
          const y = eye.y + uy * along + py * lateral;
          const a = Math.sin(m.p * Math.PI) * 0.32;
          const rad = m.size0 + m.p * m.grow;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
          grad.addColorStop(0, light(a * 0.5));
          grad.addColorStop(0.4, tint(a * 0.16));
          grad.addColorStop(1, tint(0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    let raf;
    const render = () => {
      const rect = mount.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      if (cw && ch) {
        const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
        if (cw !== canvasW || ch !== canvasH || nextDpr !== dpr) {
          canvasW = cw;
          canvasH = ch;
          dpr = nextDpr;
          canvas.width = Math.round(cw * dpr);
          canvas.height = Math.round(ch * dpr);
          canvas.style.width = `${cw}px`;
          canvas.style.height = `${ch}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cw, ch);

        smooth.current.x += (pointer.current.x - smooth.current.x) * 0.08;
        smooth.current.y += (pointer.current.y - smooth.current.y) * 0.08;
        const sx = smooth.current.x;
        const sy = smooth.current.y;

        const tx = sx * BG_SHIFT;
        const ty = sy * BG_SHIFT;
        if (bgRef.current) {
          bgRef.current.style.transform = `scale(${BG_SCALE}) translate(${tx}px, ${ty}px)`;
        }

        const scale = Math.max(cw / IMG_W, ch / IMG_H);
        const dispW = IMG_W * scale;
        const dispH = IMG_H * scale;
        const offX = (cw - dispW) / 2;
        const ox = cw / 2;
        const oy = ch / 2;
        const eyePts = EYES.map((e) => {
          const epx = offX + e.x * dispW;
          const epy = e.y * dispH;
          return {
            x: ox + BG_SCALE * (epx - ox) + BG_SCALE * tx,
            y: oy + BG_SCALE * (epy - oy) + BG_SCALE * ty,
          };
        });
        eyePts.forEach((p, i) => {
          const el = eyeRefs[i].current;
          if (el) {
            el.style.left = `${p.x}px`;
            el.style.top = `${p.y}px`;
          }
        });

        // Find the card (published by the page) relative to the mount.
        const host = mount.parentElement || document;
        let card = host.querySelector && host.querySelector('.laser-card');
        let status = null;
        if (card) {
          status = card.getAttribute('data-laser-status');
        } else if (host.querySelectorAll) {
          let best = null;
          let bestH = 0;
          host.querySelectorAll('form, [class*="card"], [class*="Card"]').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width < 80 || r.height < 60) return;
            if (r.height > bestH) {
              best = el;
              bestH = r.height;
            }
          });
          card = best;
        }
        let targetX = cw * 0.3;
        let targetY = ch * 0.5;
        if (card) {
          const cr = card.getBoundingClientRect();
          targetX = cr.left - rect.left + cr.width * 0.5;
          targetY = cr.top - rect.top + Math.min(48, cr.height * 0.16);
        }
        if (impactRef.current) {
          impactRef.current.style.left = `${targetX}px`;
          impactRef.current.style.top = `${targetY}px`;
        }

        const targetColor = laserRgbFor(modeRef.current, verdictRef.current, status);
        const col = beamColor.current;
        for (let i = 0; i < 3; i += 1) col[i] += (targetColor[i] - col[i]) * 0.05;
        const rgb = [Math.round(col[0]), Math.round(col[1]), Math.round(col[2])];
        // Publish on the document root so the form card (which lives outside
        // this background layer) can recolour its HUD in sync with the laser.
        const cssVar = `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
        mount.style.setProperty('--rls-rgb', cssVar);
        document.documentElement.style.setProperty('--rls-rgb', cssVar);

        const target = { x: targetX, y: targetY };
        const now = performance.now();
        eyePts.forEach((eye, i) =>
          drawBeam(eye, target, beamParticles.current[i], i * 2.1, now, rgb)
        );
      }
      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="robot-laser-scene" ref={mountRef}>
      <div className="rls-bg" ref={bgRef} style={{ backgroundImage: `url(${IMG})` }} />
      <div className="rls-grid" />
      <div className="rls-vignette" />
      <canvas className="rls-lasers" ref={canvasRef} />
      <div className="rls-eye" ref={eyeRefs[0]} />
      <div className="rls-eye" ref={eyeRefs[1]} />
      <div className="rls-impact" ref={impactRef} />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root { --rls-rgb: 34, 211, 255; }
        .robot-laser-scene {
          --rls-rgb: 34, 211, 255;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          overflow: hidden;
          background: #0b1120;
          pointer-events: none;
        }
        .robot-laser-scene .rls-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center top;
          transform-origin: center center;
          will-change: transform;
          z-index: 1;
        }
        .robot-laser-scene .rls-grid {
          position: absolute;
          inset: 0;
          z-index: 2;
          opacity: 0.35;
          background-image: linear-gradient(rgba(var(--rls-rgb), 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--rls-rgb), 0.06) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: radial-gradient(70% 60% at 30% 55%, #000 0%, transparent 80%);
          mask-image: radial-gradient(70% 60% at 30% 55%, #000 0%, transparent 80%);
        }
        .robot-laser-scene .rls-vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: radial-gradient(
            120% 90% at 68% 30%,
            rgba(0, 0, 0, 0) 35%,
            rgba(0, 0, 0, 0.35) 75%,
            rgba(0, 0, 0, 0.72) 100%
          );
        }
        .robot-laser-scene .rls-lasers {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 4;
        }
        .robot-laser-scene .rls-eye {
          position: absolute;
          width: 22px;
          height: 22px;
          margin: -11px 0 0 -11px;
          z-index: 5;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            #fff 0%,
            rgba(var(--rls-rgb), 0.85) 30%,
            rgba(var(--rls-rgb), 0.9) 52%,
            rgba(var(--rls-rgb), 0) 74%
          );
          filter: drop-shadow(0 0 9px rgba(var(--rls-rgb), 1))
            drop-shadow(0 0 20px rgba(var(--rls-rgb), 0.6));
          animation: rlsEyePulse 2.4s ease-in-out infinite;
        }
        @keyframes rlsEyePulse {
          0%,
          100% {
            opacity: 0.9;
            transform: scale(0.92);
          }
          50% {
            opacity: 1;
            transform: scale(1.14);
          }
        }
        .robot-laser-scene .rls-impact {
          position: absolute;
          width: 130px;
          height: 130px;
          margin: -65px 0 0 -65px;
          z-index: 4;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(var(--rls-rgb), 0.95) 20%,
            rgba(var(--rls-rgb), 0.22) 46%,
            rgba(var(--rls-rgb), 0) 70%
          );
          filter: blur(2px);
          animation: rlsImpact 1.8s ease-in-out infinite;
        }
        @keyframes rlsImpact {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(0.85) rotate(0deg);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.12) rotate(180deg);
          }
        }
        /* ---------------- HUD form card (matches the laser theme) ------------- */
        .laser-card {
          position: relative;
          background: linear-gradient(160deg, rgba(10, 20, 36, 0.82), rgba(6, 12, 22, 0.76)) !important;
          -webkit-backdrop-filter: blur(10px) saturate(120%);
          backdrop-filter: blur(10px) saturate(120%);
          border: 1px solid rgba(var(--rls-rgb), 0.32) !important;
          border-radius: 14px !important;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 34px rgba(var(--rls-rgb), 0.18),
            inset 0 0 34px rgba(var(--rls-rgb), 0.05) !important;
          animation: rlsCardEnergize 2.2s ease-in-out infinite;
        }
        @keyframes rlsCardEnergize {
          0%,
          100% {
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 26px rgba(var(--rls-rgb), 0.14),
              inset 0 0 30px rgba(var(--rls-rgb), 0.045) !important;
          }
          50% {
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 46px rgba(var(--rls-rgb), 0.3),
              inset 0 0 40px rgba(var(--rls-rgb), 0.09) !important;
          }
        }
        .laser-card::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 10px;
          pointer-events: none;
          z-index: 3;
          background: linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) left top / 22px 2px no-repeat,
            linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) left top / 2px 22px no-repeat,
            linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) right top / 22px 2px no-repeat,
            linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) right top / 2px 22px no-repeat,
            linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) left bottom / 22px 2px no-repeat,
            linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) left bottom / 2px 22px no-repeat,
            linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) right bottom / 22px 2px no-repeat,
            linear-gradient(rgb(var(--rls-rgb)), rgb(var(--rls-rgb))) right bottom / 2px 22px no-repeat;
          filter: drop-shadow(0 0 4px rgba(var(--rls-rgb), 0.55));
          opacity: 0.9;
        }
        .laser-card-header {
          position: relative;
          overflow: hidden;
          background: linear-gradient(120deg, rgba(6, 20, 34, 0.96), rgba(9, 32, 52, 0.96)) !important;
          border: 1px solid rgba(var(--rls-rgb), 0.4) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 26px rgba(var(--rls-rgb), 0.35) !important;
        }
        .laser-card-header::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(var(--rls-rgb), 0.28), transparent);
          animation: rlsScan 3s linear infinite;
        }
        @keyframes rlsScan {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }
        .laser-card-header h1,
        .laser-card-header h2,
        .laser-card-header h3,
        .laser-card-header h4 {
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #eafaff !important;
          text-shadow: 0 0 10px rgb(var(--rls-rgb)), 0 0 22px rgba(var(--rls-rgb), 0.55);
        }
        .laser-sublabel {
          margin-top: 6px;
          font-size: 11px;
          letter-spacing: 0.28em;
          color: rgb(var(--rls-rgb));
          opacity: 0.8;
          font-family: "Share Tech Mono", monospace;
        }
        .laser-card label,
        .laser-card .MuiInputLabel-root {
          color: #7fd6f0 !important;
          letter-spacing: 0.12em;
        }
        .laser-card input {
          color: #eafaff !important;
        }
        .laser-card .MuiInput-underline:before {
          border-bottom-color: rgba(var(--rls-rgb), 0.4) !important;
        }
        .laser-card .MuiInput-underline:hover:not(.Mui-disabled):before {
          border-bottom-color: rgb(var(--rls-rgb)) !important;
        }
        .laser-card .MuiInput-underline:after {
          border-bottom-color: rgb(var(--rls-rgb)) !important;
        }
        .laser-card .MuiButton-root {
          background: linear-gradient(
            120deg,
            rgba(var(--rls-rgb), 1),
            rgba(var(--rls-rgb), 0.82) 55%,
            rgba(var(--rls-rgb), 0.68)
          ) !important;
          color: #03121a !important;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4), 0 0 22px rgba(var(--rls-rgb), 0.5) !important;
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease !important;
        }
        .laser-card .MuiButton-root:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45), 0 0 34px rgba(var(--rls-rgb), 0.75) !important;
          filter: brightness(1.08);
        }
        .laser-card .MuiButton-root:disabled {
          filter: grayscale(0.4) brightness(0.8);
        }
        .laser-card .MuiTypography-root,
        .laser-card p,
        .laser-card li {
          color: #c8dcec;
        }
        .laser-card .MuiDivider-root {
          background-color: rgba(var(--rls-rgb), 0.25);
        }
        @media (prefers-reduced-motion: reduce) {
          .robot-laser-scene .rls-eye,
          .robot-laser-scene .rls-impact,
          .laser-card,
          .laser-card-header::after {
            animation: none !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
