"use client";

import { useEffect, useRef } from "react";

type Node = { hx: number; hy: number; x: number; y: number; ph: number; amp: number; r: number; c: string };
type Pulse = { a: number; b: number; t: number; hops: number };

const COLORS = ["#9a8cff", "#6fb4ff", "#ff8f7e", "#7fe3cc", "#c9a6ff"];

/**
 * Нейросеть на первом экране: узлы плавно дышат, связи появляются между близкими
 * узлами, по связям бегут импульсы — как сигналы между нейронами.
 */
export default function NeuroCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let raf = 0;
    let visible = true;
    let last = 0;
    const mouse = { x: -9999, y: -9999 };

    // нормальное распределение — узлы гуще в центре облака
    const gauss = () => {
      let u = 0;
      let v = 0;
      while (!u) u = Math.random();
      while (!v) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    const build = () => {
      const mobile = w < 860;
      const count = mobile ? 46 : 90;
      const cx = mobile ? w * 0.6 : w * 0.72;
      const cy = mobile ? h * 0.2 : h * 0.47;
      const sx = mobile ? w * 0.34 : w * 0.17;
      const sy = mobile ? h * 0.13 : h * 0.26;
      nodes = Array.from({ length: count }, () => {
        const hx = cx + gauss() * sx;
        const hy = cy + gauss() * sy;
        return {
          hx,
          hy,
          x: hx,
          y: hy,
          ph: Math.random() * Math.PI * 2,
          amp: 4 + Math.random() * 10,
          r: 1 + Math.random() * 2.2,
          c: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });
      pulses = [];
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

    const linkDist = () => (w < 860 ? 78 : 118);

    const neighbours = (i: number) => {
      const d = linkDist();
      const res: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (dx * dx + dy * dy < d * d) res.push(j);
      }
      return res;
    };

    const spawn = () => {
      const a = Math.floor(Math.random() * nodes.length);
      const n = neighbours(a);
      if (n.length) pulses.push({ a, b: n[Math.floor(Math.random() * n.length)], t: 0, hops: 3 + Math.floor(Math.random() * 4) });
    };

    const draw = (time: number) => {
      const dt = Math.min(64, time - last || 16);
      last = time;
      const s = time * 0.001;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x = n.hx + Math.sin(s * 0.6 + n.ph) * n.amp;
        n.y = n.hy + Math.cos(s * 0.5 + n.ph * 1.3) * n.amp;
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dd = dx * dx + dy * dy;
        if (dd < 140 * 140) {
          const f = (1 - Math.sqrt(dd) / 140) * 26;
          const len = Math.sqrt(dd) || 1;
          n.x += (dx / len) * f;
          n.y += (dy / len) * f;
        }
      }

      const d = linkDist();
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > d * d) continue;
          const alpha = (1 - Math.sqrt(dist2) / d) * 0.32;
          ctx.strokeStyle = `rgba(190, 200, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.c;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (Math.random() < dt / 260) spawn();
      const next: Pulse[] = [];
      for (const p of pulses) {
        p.t += dt / 700;
        const a = nodes[p.a];
        const b = nodes[p.b];
        const x = a.x + (b.x - a.x) * Math.min(p.t, 1);
        const y = a.y + (b.y - a.y) * Math.min(p.t, 1);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, "rgba(255, 236, 220, 0.95)");
        g.addColorStop(0.25, `${b.c}aa`);
        g.addColorStop(1, `${b.c}00`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        if (p.t < 1) next.push(p);
        else if (p.hops > 0) {
          // сигнал передаётся дальше по цепочке
          const n = neighbours(p.b).filter((k) => k !== p.a);
          if (n.length) next.push({ a: p.b, b: n[Math.floor(Math.random() * n.length)], t: 0, hops: p.hops - 1 });
        }
      }
      pulses = next.slice(-40);
    };

    const loop = (t: number) => {
      draw(t);
      if (visible) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
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
