"use client";

import { useEffect, useRef } from "react";
import { PHRASES } from "@/content";

/**
 * Нейросеть на первом экране — объёмное облако.
 * Узлы лежат в 3D, облако медленно вращается и плавно наклоняется за мышью;
 * ближние нейроны крупнее и ярче, дальние тише, на переднем плане — мягкие блики (глубина резкости).
 * По связям медленно плывут импульсы; касаясь нейрона, импульс вспыхивает звёздочкой с лучами.
 */

type Node = { x: number; y: number; z: number; ph: number; r: number; c: number };
type Pulse = { e: number; t: number; fwd: boolean; hops: number; s: number };
type Flash = { i: number; t: number; rot: number };
type Bokeh = { x: number; y: number; r: number; s: number; ph: number; a: number };
type Phrase = { i: number; text: string; t: number };

// спокойная тёплая гамма: персиково-золотой, светлый и редкий фиолетовый акцент
const PALETTE: [number, number, number][] = [
  [255, 197, 138],
  [255, 224, 184],
  [183, 156, 255],
];
const pick = () => {
  const r = Math.random();
  return r < 0.1 ? 2 : r < 0.4 ? 1 : 0;
};

/** Мягкое свечение заранее, чтобы не пересчитывать градиенты каждый кадр. */
function glowSprite([r, g, b]: [number, number, number], core: number) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const x = c.getContext("2d")!;
  const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, `rgba(255,248,236,${core})`);
  gr.addColorStop(0.18, `rgba(${r},${g},${b},0.55)`);
  gr.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, s, s);
  return c;
}

export default function NeuroCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glows = PALETTE.map((c) => glowSprite(c, 0.95));
    const softs = PALETTE.map((c) => glowSprite(c, 0.25));

    let w = 0, h = 0, R = 1;
    let nodes: Node[] = [];
    let edges: [number, number][] = [];
    let pulses: Pulse[] = [];
    let flashes: Flash[] = [];
    let bokeh: Bokeh[] = [];
    let phrases: Phrase[] = [];
    let lastPhrase = 0;
    const recent: string[] = [];
    let raf = 0;
    let visible = true;
    let last = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999 };
    // экранные координаты узлов в текущем кадре и плавный сдвиг от курсора (перестроение сети)
    let sx = new Float32Array(0), sy = new Float32Array(0), sq = new Float32Array(0), ss = new Float32Array(0);
    let ox = new Float32Array(0), oy = new Float32Array(0);

    const gauss = () => {
      let u = 0, v = 0;
      while (!u) u = Math.random();
      while (!v) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    const center = () => (w < 860 ? { x: w * 0.6, y: h * 0.21 } : { x: w * 0.72, y: h * 0.47 });

    const build = () => {
      const mobile = w < 860;
      R = mobile ? Math.min(w, h) * 0.42 : Math.min(w * 0.22, h * 0.38);
      const count = mobile ? 70 : 140;
      nodes = Array.from({ length: count }, () => ({
        x: gauss() * R * 0.55,
        y: gauss() * R * 0.62,
        z: gauss() * R * 0.55,
        ph: Math.random() * Math.PI * 2,
        r: 0.8 + Math.random() * 1.6,
        c: pick(),
      }));
      // связи считаем один раз в 3D: до 4 ближайших соседей
      edges = [];
      const L = R * 0.42;
      nodes.forEach((a, i) => {
        const near: [number, number][] = [];
        nodes.forEach((b, j) => {
          if (j <= i) return;
          const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
          if (d < L) near.push([d, j]);
        });
        near.sort((p, q) => p[0] - q[0]).slice(0, 4).forEach(([, j]) => edges.push([i, j]));
      });
      sx = new Float32Array(count); sy = new Float32Array(count); sq = new Float32Array(count); ss = new Float32Array(count);
      ox = new Float32Array(count); oy = new Float32Array(count);
      pulses = [];
      flashes = [];
      phrases = [];
      bokeh =Array.from({ length: mobile ? 6 : 12 }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: 30 + Math.random() * 70,
        s: 4 + Math.random() * 8, ph: Math.random() * Math.PI * 2, a: 0.04 + Math.random() * 0.07,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const spawn = () => {
      if (!edges.length) return;
      pulses.push({ e: Math.floor(Math.random() * edges.length), t: 0, fwd: Math.random() < 0.5, hops: 2 + Math.floor(Math.random() * 4), s: 0.7 + Math.random() * 0.6 });
    };

    const draw = (time: number) => {
      const dt = Math.min(48, time - last || 16);
      last = time;
      const s = time * 0.001;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // плавная инерция мыши
      mouse.x += (mouse.tx - mouse.x) * 0.03;
      mouse.y += (mouse.ty - mouse.y) * 0.03;
      const yaw = s * 0.05 + mouse.x * 0.45, pitch = 0.12 + mouse.y * 0.22;
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const c = center();
      const F = R * 3.2;

      // проекция: вращение облака, перспектива, «близость» узла 0..1
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = Math.sin(s * 0.22 + n.ph) * R * 0.015, dy = Math.cos(s * 0.18 + n.ph * 1.3) * R * 0.015;
        const x = n.x + dx, y = n.y + dy, z = n.z;
        const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
        const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        const k = F / (F + z2);
        const bx = c.x + x1 * k + mouse.x * -18 * k;
        const by = c.y + y1 * k + mouse.y * -12 * k;
        // перестроение: нейроны мягко расступаются вокруг курсора и плавно возвращаются
        const dxm = bx - mouse.px, dym = by - mouse.py, dm = Math.hypot(dxm, dym) || 1;
        const rad = 170;
        const push = dm < rad ? Math.pow(1 - dm / rad, 1.6) * 60 : 0;
        const ease = 1 - Math.pow(0.0025, dt / 1000); // пружина: ~плавное догоняние цели
        ox[i] += ((dxm / dm) * push - ox[i]) * ease;
        oy[i] += ((dym / dm) * push - oy[i]) * ease;
        sx[i] = bx + ox[i];
        sy[i] = by + oy[i];
        sq[i] = Math.max(0, Math.min(1, 0.5 - z2 / (R * 1.4)));
        ss[i] = k;
      }

      // связи: дальние тонкие и тусклые, ближние толще и ярче
      for (const [a, b] of edges) {
        const q = (sq[a] + sq[b]) / 2;
        const len = Math.hypot(sx[a] - sx[b], sy[a] - sy[b]);
        if (len > R * 0.7) continue;
        ctx.strokeStyle = `rgba(255, 200, 155, ${(0.05 + q * 0.28) * (1 - len / (R * 0.7))})`;
        ctx.lineWidth = 0.4 + q * 1.1;
        ctx.beginPath();
        ctx.moveTo(sx[a], sy[a]);
        ctx.lineTo(sx[b], sy[b]);
        ctx.stroke();
      }

      // узлы: ядро и мягкий ореол, размер и яркость — по глубине
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], q = sq[i];
        const twinkle = 0.85 + 0.15 * Math.sin(s * 1.3 + n.ph * 3);
        const size = n.r * ss[i] * (0.6 + q * 1.1);
        ctx.globalAlpha = (0.25 + 0.75 * q) * twinkle;
        const g = size * 9;
        ctx.drawImage(q > 0.35 ? glows[n.c] : softs[n.c], sx[i] - g / 2, sy[i] - g / 2, g, g);
      }
      ctx.globalAlpha = 1;

      // импульсы медленно плывут по связям
      if (Math.random() < dt / 700) spawn();
      const next: Pulse[] = [];
      for (const p of pulses) {
        p.t += (dt / 2600) * p.s;
        const [a0, b0] = edges[p.e];
        const a = p.fwd ? a0 : b0, b = p.fwd ? b0 : a0;
        const t = Math.min(1, p.t);
        const x = sx[a] + (sx[b] - sx[a]) * t, y = sy[a] + (sy[b] - sy[a]) * t;
        const q = sq[a] + (sq[b] - sq[a]) * t;
        const g = (10 + q * 16) * (0.6 + 0.4 * Math.sin(t * Math.PI));
        ctx.globalAlpha = 0.5 + q * 0.5;
        ctx.drawImage(glows[0], x - g / 2, y - g / 2, g, g);
        ctx.globalAlpha = 1;
        if (p.t < 1) { next.push(p); continue; }
        if (flashes.length < 8) flashes.push({ i: b, t: 0, rot: Math.random() * Math.PI });
        if (p.hops > 0) {
          const nextEdges: number[] = [];
          edges.forEach((e, j) => { if (j !== p.e && (e[0] === b || e[1] === b)) nextEdges.push(j); });
          if (nextEdges.length) {
            const e = nextEdges[Math.floor(Math.random() * nextEdges.length)];
            next.push({ e, t: 0, fwd: edges[e][0] === b, hops: p.hops - 1, s: p.s });
          }
        }
      }
      pulses = next.slice(-30);

      // вспышки-звёздочки с лучами при касании нейрона
      flashes = flashes.filter((f) => {
        f.t += dt / 1500;
        const k = Math.min(1, f.t), q = sq[f.i];
        const a = Math.pow(1 - k, 1.5) * (0.45 + 0.55 * q);
        const grow = Math.sqrt(k);
        const x = sx[f.i], y = sy[f.i], scale = 0.6 + q * 0.7;
        ctx.globalAlpha = a;
        const g = 44 * scale;
        ctx.drawImage(glows[1], x - g / 2, y - g / 2, g, g);
        for (let r = 0; r < 8; r++) {
          const ang = f.rot + (r * Math.PI) / 4;
          const len = (r % 2 === 0 ? 64 : 24) * scale * (0.35 + 0.65 * grow);
          const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
          const lg = ctx.createLinearGradient(x, y, ex, ey);
          lg.addColorStop(0, "rgba(255, 244, 226, 0.9)");
          lg.addColorStop(1, "rgba(255, 210, 160, 0)");
          ctx.strokeStyle = lg;
          ctx.lineWidth = r % 2 === 0 ? 1.3 : 0.9;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        return f.t < 1;
      });

      // фразы: проявляются у ближнего нейрона (он вспыхивает), живут ~4.5 с и растворяются, уплывая вверх
      if (time - lastPhrase > 3200 && phrases.length < 2 && nodes.length) {
        const mobile = w < 860;
        const ok: number[] = [];
        for (let i = 0; i < nodes.length; i++) {
          if (sq[i] < 0.45) continue;
          // на телефоне — только над плашкой и заголовком, на компьютере — правее текста
          if (mobile ? sy[i] > 180 || sy[i] < 80 : sx[i] < w * 0.6 || sy[i] < 90 || sy[i] > h * 0.7) continue;
          // вторая фраза — подальше от первой и на другой высоте, чтобы не слипались
          if (phrases.some((p) => Math.hypot(sx[p.i] - sx[i], sy[p.i] - sy[i]) < 260 || Math.abs(sy[p.i] - sy[i]) < 70)) continue;
          ok.push(i);
        }
        if (ok.length) {
          const i = ok[Math.floor(Math.random() * ok.length)];
          const pool = PHRASES.filter((p) => !recent.includes(p));
          const text = pool[Math.floor(Math.random() * pool.length)];
          recent.push(text);
          if (recent.length > 3) recent.shift();
          phrases.push({ i, text, t: 0 });
          flashes.push({ i, t: 0, rot: Math.random() * Math.PI });
          lastPhrase = time;
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.textBaseline = "middle";
      phrases = phrases.filter((p) => {
        p.t += dt / 4500;
        const k = Math.min(1, p.t);
        const a = Math.min(1, k / 0.18) * Math.min(1, (1 - k) / 0.3);
        const q = sq[p.i];
        const size = Math.round((w < 860 ? 12 : 14) + q * 3);
        ctx.font = `500 ${size}px Onest, sans-serif`;
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.14em";
        const text = p.text.toUpperCase();
        const tw = ctx.measureText(text).width;
        const x0 = sx[p.i], y0 = sy[p.i] - k * 14;
        // справа от нейрона, иначе слева; если не влезает ни там, ни там — сдвигаем внутрь экрана
        const right = x0 + 16 + tw < w - 16;
        ctx.textAlign = "left";
        let tx = right ? x0 + 16 : x0 - 16 - tw;
        tx = Math.max(16, Math.min(w - 16 - tw, tx));
        ctx.shadowColor = "rgba(255, 190, 130, 0.8)";
        ctx.shadowBlur = 14;
        ctx.fillStyle = `rgba(255, 240, 224, ${0.92 * a})`;
        ctx.fillText(text, tx, y0);
        ctx.shadowBlur = 0;
        // тонкая линия от нейрона к фразе
        ctx.strokeStyle = `rgba(255, 210, 165, ${0.4 * a})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x0 + (right ? 4 : -4), sy[p.i]);
        ctx.lineTo(right ? tx - 6 : tx + tw + 6, y0);
        ctx.stroke();
        return p.t < 1;
      });
      ctx.globalCompositeOperation = "lighter";

      // мягкие блики переднего плана — «вне фокуса», двигаются сильнее облака
      for (const b of bokeh) {
        const x = b.x + Math.sin(s * 0.05 * b.s + b.ph) * 40 - mouse.x * 50;
        const y = b.y + Math.cos(s * 0.04 * b.s + b.ph) * 30 - mouse.y * 35;
        ctx.globalAlpha = b.a;
        ctx.drawImage(softs[1], x - b.r, y - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (t: number) => {
      draw(t);
      if (visible) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      const rect = canvas.getBoundingClientRect();
      mouse.px = e.clientX - rect.left;
      mouse.py = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.px = -9999;
      mouse.py = -9999;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    });

    resize();
    draw(0);
    let rw = window.innerWidth;
    const onResize = () => {
      // на телефоне адресная строка меняет высоту при прокрутке — не перестраиваем сеть из-за этого
      if (window.innerWidth === rw) return;
      rw = window.innerWidth;
      resize();
    };
    window.addEventListener("resize", onResize);
    if (!reduce) {
      window.addEventListener("pointermove", onMove);
      document.addEventListener("pointerleave", onLeave);
      io.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
