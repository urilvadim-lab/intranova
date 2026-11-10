"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PHRASES } from "@/content";

/**
 * Балерина: живое видео, вырезанное из тёмной сцены и тонированное в золото.
 * Местами изображение растворяется в точечную «кодовую» сетку; поверх — нейронная сеть,
 * узлы которой держатся за контуры тела и движутся вместе с ним. На фоне — тёплая пыль
 * и вспыхивающие нейронные связи. Фразы проявляются рядом с фигурой.
 */

const SRC = "/_src/swan.mp4";
const LOOP = [68, 92]; // фрагмент танца, секунды
const CROP = { x: 0.2, y: 0.05, w: 0.55, h: 0.93 }; // окно кадра с балериной (доли кадра)
const AW = 132; // ширина сетки анализа кадра

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform vec4 crop;      // x, y (сверху), w, h — в долях кадра
  uniform vec2 texel;
  uniform float time;
  uniform float cell;     // размер ячейки точечной сетки, px
  uniform float wave;     // положение нейронной волны по высоте (0 — ступни, 1 — макушка)
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.1 + 3.7) * 0.3 + noise(p * 4.3 + 9.1) * 0.15; }
  vec2 tex(vec2 uv) { return vec2(crop.x + uv.x * crop.z, 1.0 - (crop.y + (1.0 - uv.y) * crop.w)); }
  float lumAt(vec2 uv) { vec3 c = texture2D(map, tex(uv)).rgb; return dot(c, vec3(0.3, 0.59, 0.11)); }

  vec3 gold(float t) {
    vec3 a = vec3(0.16, 0.06, 0.03), b = vec3(0.78, 0.40, 0.13), c = vec3(1.0, 0.74, 0.40), d = vec3(1.0, 0.95, 0.86);
    if (t < 0.35) return mix(a, b, t / 0.35);
    if (t < 0.72) return mix(b, c, (t - 0.35) / 0.37);
    return mix(c, d, (t - 0.72) / 0.28);
  }

  void main() {
    // помехи: редкие горизонтальные сдвиги строк, как у живого цифрового сигнала
    vec2 uv = vUv;
    float row = floor(uv.y * 90.0);
    float glitch = step(0.988, hash(vec2(row, floor(time * 9.0))));
    uv.x += (hash(vec2(row * 1.7, floor(time * 9.0))) - 0.5) * 0.035 * glitch;
    float lum = lumAt(uv);
    // мягкое свечение вокруг тела — несколько выборок по кругу
    float halo = 0.0;
    for (int k = 0; k < 8; k++) {
      float a = float(k) * 0.785;
      halo += lumAt(vUv + vec2(cos(a), sin(a)) * texel * 7.0);
    }
    halo /= 8.0;

    float key = smoothstep(0.05, 0.2, lum);                  // вырезаем тёмную сцену, щадя тёмные детали
    float tone = pow(clamp((lum - 0.04) / 0.8, 0.0, 1.0), 1.1);
    // реалистичная светотень оригинала, мягко тонированная в золото (без плоской заливки)
    vec3 src = texture2D(map, tex(uv)).rgb;
    // лёгкое цветное двоение на краях — тёплое
    float lr = lumAt(uv + vec2(texel.x * 2.0, 0.0)), lb = lumAt(uv - vec2(texel.x * 2.0, 0.0));
    float l2 = dot(src, vec3(0.3, 0.59, 0.11));
    vec3 col = mix(vec3(l2) * vec3(1.05, 0.92, 0.78), gold(tone), 0.55);
    col += vec3(0.25, 0.08, -0.05) * (lr - lb) * 1.5;
    col *= 0.85 + 0.35 * tone;
    // живое мерцание бликов
    col *= 0.93 + 0.14 * hash(floor(gl_FragCoord.xy / 2.0) + floor(time * 18.0)) * tone;

    // нейронная волна: светлая полоса идёт по телу снизу вверх
    float band = exp(-pow((vUv.y - wave) * 11.0, 2.0));
    col += vec3(1.0, 0.78, 0.45) * band * tone * 0.55;

    // растворение: гуляющие пятна, сильнее на краях фигуры и у ступней, и там, где идёт волна
    float edge = 1.0 - smoothstep(0.18, 0.5, halo);
    float n = fbm(vUv * vec2(5.0, 7.0) + vec2(time * 0.05, -time * 0.07));
    float feet = 1.0 - smoothstep(0.0, 0.2, vUv.y);
    float dis = smoothstep(0.58, 0.82, n + edge * 0.35 + feet * 0.3 + band * 0.3);

    // в растворённых местах — точечная «кодовая» сетка вместо изображения
    vec2 g = fract(gl_FragCoord.xy / cell) - 0.5;
    float r = 0.12 + tone * 0.32;
    float dotv = 1.0 - smoothstep(r - 0.08, r, length(g));
    float flick = 0.75 + 0.25 * hash(floor(gl_FragCoord.xy / cell) + floor(time * 3.0));
    float a = mix(key, key * dotv * flick, dis);

    // ореол
    float glow = smoothstep(0.08, 0.4, halo) * (1.0 - key) * 0.35;
    vec3 outc = col * a + vec3(1.0, 0.62, 0.28) * glow;
    float outa = clamp(a + glow, 0.0, 1.0);
    gl_FragColor = vec4(outc, outa);
  }
`;

type Node = { x: number; y: number; tx: number; ty: number; px: number; py: number; ox: number; oy: number };
type Spark = { a: number; b: number; t: number };
type Flash = { n: number; t: number; rot: number };
type Ember = { x: number; y: number; vx: number; vy: number; t: number };
type Phrase = { n: number; text: string; t: number };

export default function NeuroSwan({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // три слоя: фон (2D), видео (WebGL), сеть и фразы (2D)
    const mk = () => {
      const c = document.createElement("canvas");
      c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
      host.appendChild(c);
      return c;
    };
    const bgC = mk();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);
    const fxC = mk();
    const bg = bgC.getContext("2d")!, fx = fxC.getContext("2d")!;

    const video = document.createElement("video");
    video.src = SRC;
    video.muted = true;
    video.loop = false;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    const onMeta = () => { video.currentTime = LOOP[0]; video.play().catch(() => {}); };
    const onTime = () => { if (video.currentTime > LOOP[1] || video.currentTime < LOOP[0] - 0.5) video.currentTime = LOOP[0]; };
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("timeupdate", onTime);

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const crop = new THREE.Vector4(CROP.x, CROP.y, CROP.w, CROP.h);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { map: { value: texture }, crop: { value: crop }, texel: { value: new THREE.Vector2(1 / 600, 1 / 600) }, time: { value: 0 }, cell: { value: 5 * dpr }, wave: { value: -1 } },
      transparent: true,
      depthWrite: false,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    scene.add(plane);

    // раскладка: фигура справа, примерно 70% высоты экрана
    let w = 0, h = 0, rect = { x: 0, y: 0, w: 0, h: 0 };
    const AH = Math.round((AW * CROP.h * 9) / (CROP.w * 16));
    const layout = () => {
      const r = host.getBoundingClientRect();
      w = r.width;
      h = r.height;
      renderer.setSize(w, h, false);
      for (const c of [bgC, fxC]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      fx.setTransform(dpr, 0, 0, dpr, 0, 0);
      camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      const mobile = w < 860;
      const ph = mobile ? h * 0.42 : Math.min(h * 0.74, 720);
      const pw = (ph * AW) / AH;
      rect = mobile ? { x: w / 2 - pw / 2, y: 70, w: pw, h: ph } : { x: w * 0.72 - pw / 2, y: h * 0.47 - ph / 2, w: pw, h: ph };
      plane.scale.set(rect.w, rect.h, 1);
      mat.uniforms.texel.value.set(1 / (rect.w * 1.4), 1 / (rect.h * 1.4));
    };
    layout();

    /* анализ кадра: яркость и контраст для узлов сети, центр фигуры для кадрирования */
    const an = document.createElement("canvas");
    an.width = AW;
    an.height = AH;
    const ac = an.getContext("2d", { willReadFrequently: true })!;
    let lum = new Float32Array(AW * AH), score = new Float32Array(AW * AH);
    let bright: number[] = [];
    let body: number[] = []; // освещённые точки тела — опоры для роя
    let cx = 0.5;
    const analyse = () => {
      if (video.readyState < 2) return;
      const vw = video.videoWidth, vh = video.videoHeight;
      ac.drawImage(video, crop.x * vw, crop.y * vh, crop.z * vw, crop.w * vh, 0, 0, AW, AH);
      const d = ac.getImageData(0, 0, AW, AH).data;
      let sx = 0, sw = 0;
      for (let i = 0; i < AW * AH; i++) {
        const l = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) / 255;
        lum[i] = l;
        if (l > 0.2) { sx += (i % AW) * l; sw += l; }
      }
      bright = [];
      body = [];
      for (let i = 0; i < AW * AH; i++) if (lum[i] > 0.26) body.push(i);
      for (let y = 1; y < AH - 1; y++)
        for (let x = 1; x < AW - 1; x++) {
          const i = y * AW + x;
          const e = Math.abs(lum[i + 1] - lum[i - 1]) + Math.abs(lum[i + AW] - lum[i - AW]);
          score[i] = lum[i] > 0.18 ? lum[i] * 0.5 + e * 2 : 0;
          if (score[i] > 0.35) bright.push(i);
        }
      // держим балерину по центру окна: сдвигаем окно вслед за ней, плавно
      if (sw > 0) {
        cx = sx / sw / AW;
        crop.x = Math.max(0, Math.min(1 - crop.z, crop.x + (cx - 0.5) * crop.z * 0.15));
      }
    };

    /* нейронная сеть на теле */
    const mobile = w < 860;

    /* рой на коже: мельчайшие пылинки кружат вокруг освещённых точек тела и перескакивают */
    const P = mobile ? 1300 : 3000;
    const sAx = new Float32Array(P), sAy = new Float32Array(P), sPh = new Float32Array(P), sR = new Float32Array(P), sV = new Float32Array(P);
    for (let i = 0; i < P; i++) {
      sAx[i] = -1;
      sPh[i] = Math.random() * Math.PI * 2;
      sR[i] = 0.3 + Math.random() * 1.4;
      sV[i] = 0.6 + Math.random() * 1.8;
    }
    const reanchor = () => {
      if (!body.length) return;
      for (let i = 0; i < P; i++) {
        const lost = sAx[i] < 0 || lum[Math.round(sAy[i]) * AW + Math.round(sAx[i])] < 0.2;
        if (lost || Math.random() < 0.1) {
          const k = body[Math.floor(Math.random() * body.length)];
          sAx[i] = (k % AW) + Math.random() - 0.5;
          sAy[i] = Math.floor(k / AW) + Math.random() - 0.5;
        }
      }
    };

    const NODES = mobile ? 40 : 70;
    const nodes: Node[] = Array.from({ length: NODES }, () => ({ x: Math.random() * AW, y: Math.random() * AH, tx: 0, ty: 0, px: 0, py: 0, ox: 0, oy: 0 }));
    nodes.forEach((n) => { n.tx = n.x; n.ty = n.y; });
    const stick = () => {
      for (const n of nodes) {
        // узел подтягивается к самой яркой/контрастной точке рядом — держится за тело
        let best = -1, bs = 0;
        const cx0 = Math.round(n.tx), cy0 = Math.round(n.ty);
        for (let dy = -4; dy <= 4; dy++)
          for (let dx = -4; dx <= 4; dx++) {
            const x = cx0 + dx, y = cy0 + dy;
            if (x < 1 || y < 1 || x >= AW - 1 || y >= AH - 1) continue;
            const s = score[y * AW + x] - (dx * dx + dy * dy) * 0.004;
            if (s > bs) { bs = s; best = y * AW + x; }
          }
        if (best < 0 || bs < 0.25) {
          if (bright.length) {
            const i = bright[Math.floor(Math.random() * bright.length)];
            n.tx = i % AW; n.ty = Math.floor(i / AW); n.x = n.tx; n.y = n.ty;
          }
        } else {
          n.tx = n.tx + ((best % AW) - n.tx) * 0.6;
          n.ty = n.ty + (Math.floor(best / AW) - n.ty) * 0.6;
        }
      }
    };
    const toScreen = (ax: number, ay: number) => ({ x: rect.x + (ax / AW) * rect.w, y: rect.y + (ay / AH) * rect.h });

    /* фон: тёплая пыль и вспыхивающие нейронные связи */
    const dust = Array.from({ length: mobile ? 60 : 140 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), ph: Math.random() * 6.28 }));
    let sparks: Spark[] = [];
    let flashes: Flash[] = [];
    let embers: Ember[] = [];
    let phrases: Phrase[] = [];
    const recent: string[] = [];
    let lastPhrase = 0, lastFlash = 0, lastSpark = 0, lastAnalyse = 0;
    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    const star = (x: number, y: number, k: number, rot: number, scale: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(k)) return;
      const a = Math.pow(1 - k, 1.4), grow = Math.sqrt(k);
      const g = fx.createRadialGradient(x, y, 0, x, y, 20 * scale);
      g.addColorStop(0, `rgba(255,248,236,${0.95 * a})`);
      g.addColorStop(0.35, `rgba(255,190,120,${0.4 * a})`);
      g.addColorStop(1, "rgba(255,190,120,0)");
      fx.fillStyle = g;
      fx.beginPath(); fx.arc(x, y, 20 * scale, 0, Math.PI * 2); fx.fill();
      for (let r = 0; r < 8; r++) {
        const an2 = rot + (r * Math.PI) / 4, len = (r % 2 === 0 ? 58 : 22) * scale * (0.35 + 0.65 * grow);
        const ex = x + Math.cos(an2) * len, ey = y + Math.sin(an2) * len;
        const lg = fx.createLinearGradient(x, y, ex, ey);
        lg.addColorStop(0, `rgba(255,244,226,${0.85 * a})`);
        lg.addColorStop(1, "rgba(255,200,140,0)");
        fx.strokeStyle = lg;
        fx.lineWidth = r % 2 === 0 ? 1.3 : 0.9;
        fx.beginPath(); fx.moveTo(x, y); fx.lineTo(ex, ey); fx.stroke();
      }
    };

    let raf = 0, last = performance.now();
    const start = last;
    const frame = (now: number) => {
      // метка первого кадра бывает раньше момента запуска — шаг не может быть отрицательным
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const t = (now - start) / 1000;
      mouse.nx += (mouse.tx - mouse.nx) * 0.04;
      mouse.ny += (mouse.ty - mouse.ny) * 0.04;

      if (now - lastAnalyse > 80) {
        analyse();
        nodes.forEach((n) => { n.px = n.x; n.py = n.y; });
        stick();
        reanchor();
        lastAnalyse = now;
      }
      const kk = Math.min(1, (now - lastAnalyse) / 80);
      nodes.forEach((n) => {
        n.x = n.px + (n.tx - n.px) * kk;
        n.y = n.py + (n.ty - n.py) * kk;
        // защита: «потерявшийся» узел возвращаем в центр, дальше он сам найдёт тело
        if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) {
          n.x = n.px = n.tx = AW / 2;
          n.y = n.py = n.ty = AH / 2;
          n.ox = n.oy = 0;
        }
      });

      // видео со сдвигом-параллаксом
      plane.position.set(rect.x + rect.w / 2 - w / 2 - mouse.nx * 10, h / 2 - (rect.y + rect.h / 2) - mouse.ny * 8, 0);
      mat.uniforms.time.value = t;
      // нейронная волна: раз в ~6 секунд проходит от ступней к макушке
      const wave = -0.15 + ((t * 0.16) % 1) * 1.3;
      mat.uniforms.wave.value = wave;
      const prox = (ay: number) => Math.exp(-Math.pow((1 - ay / AH - wave) * 7, 2));
      renderer.render(scene, camera);

      /* фон */
      bg.clearRect(0, 0, w, h);
      bg.globalCompositeOperation = "lighter";
      const dpos = dust.map((p) => ({
        x: (p.x * w + Math.sin(t * 0.07 + p.ph) * 30 - mouse.nx * 30 * p.z + w) % w,
        y: (p.y * h + Math.cos(t * 0.05 + p.ph) * 24 - mouse.ny * 20 * p.z + h) % h,
        z: p.z,
      }));
      for (const p of dpos) {
        const r = 0.6 + p.z * 1.8;
        bg.fillStyle = `rgba(255,${190 + p.z * 40},${130 + p.z * 60},${0.15 + p.z * 0.35})`;
        bg.beginPath(); bg.arc(p.x, p.y, r, 0, Math.PI * 2); bg.fill();
      }
      if (now - lastSpark > 700) {
        // новая связь между двумя близкими пылинками: линия прорастает, по ней бежит искра
        const a = Math.floor(Math.random() * dpos.length);
        let b = -1, bd = 1e9;
        dpos.forEach((p, i) => { const d = Math.hypot(p.x - dpos[a].x, p.y - dpos[a].y); if (i !== a && d < bd && d > 30) { bd = d; b = i; } });
        if (b >= 0 && bd < 260) sparks.push({ a, b, t: 0 });
        lastSpark = now;
      }
      sparks = sparks.filter((s) => {
        s.t += dt / 2.4;
        const A = dpos[s.a], B = dpos[s.b];
        const grow = Math.min(1, s.t * 2.5), fade = s.t > 0.6 ? 1 - (s.t - 0.6) / 0.4 : 1;
        bg.strokeStyle = `rgba(255,200,145,${0.35 * fade})`;
        bg.lineWidth = 0.8;
        bg.beginPath(); bg.moveTo(A.x, A.y); bg.lineTo(A.x + (B.x - A.x) * grow, A.y + (B.y - A.y) * grow); bg.stroke();
        const sx = A.x + (B.x - A.x) * Math.min(1, s.t * 1.6), sy = A.y + (B.y - A.y) * Math.min(1, s.t * 1.6);
        const g = bg.createRadialGradient(sx, sy, 0, sx, sy, 9);
        g.addColorStop(0, `rgba(255,240,220,${0.9 * fade})`);
        g.addColorStop(1, "rgba(255,190,120,0)");
        bg.fillStyle = g;
        bg.beginPath(); bg.arc(sx, sy, 9, 0, Math.PI * 2); bg.fill();
        return s.t < 1;
      });
      bg.globalCompositeOperation = "source-over";

      /* сеть на теле */
      fx.clearRect(0, 0, w, h);
      fx.globalCompositeOperation = "lighter";

      // рой на коже
      const sxk = rect.w / AW, syk = rect.h / AH;
      for (let i = 0; i < P; i++) {
        if (sAx[i] < 0) continue;
        const a = sPh[i] + t * sV[i];
        const ax = sAx[i] + Math.cos(a) * sR[i], ay = sAy[i] + Math.sin(a * 1.3) * sR[i];
        const l = lum[Math.min(AH - 1, Math.max(0, Math.round(ay))) * AW + Math.min(AW - 1, Math.max(0, Math.round(ax)))];
        const al = Math.min(1, l * 0.55 + prox(ay) * 0.45) * (0.5 + 0.5 * Math.sin(a * 2.1));
        if (al < 0.04) continue;
        fx.fillStyle = `rgba(255,${200 + l * 50},${140 + l * 90},${al})`;
        fx.fillRect(rect.x + ax * sxk - mouse.nx * 10, rect.y + ay * syk - mouse.ny * 8, 1.3, 1.3);
      }
      const sp = nodes.map((n) => {
        const s = toScreen(n.x, n.y);
        s.x -= mouse.nx * 10; s.y -= mouse.ny * 8;
        // узлы расступаются от курсора и плавно возвращаются
        const dx = s.x - mouse.x, dy = s.y - mouse.y, d = Math.hypot(dx, dy) || 1;
        const push = d < 130 ? Math.pow(1 - d / 130, 1.5) * 40 : 0;
        n.ox += ((dx / d) * push - n.ox) * 0.12;
        n.oy += ((dy / d) * push - n.oy) * 0.12;
        if (!Number.isFinite(n.ox) || !Number.isFinite(n.oy)) n.ox = n.oy = 0;
        return { x: s.x + n.ox, y: s.y + n.oy };
      });
      // связи загораются только там, где проходит волна — импульс бежит по нервам
      const np = nodes.map((n) => prox(n.y));
      const LD = mobile ? 46 : 64;
      for (let i = 0; i < sp.length; i++)
        for (let j = i + 1; j < sp.length; j++) {
          const p = (np[i] + np[j]) / 2;
          if (p < 0.05) continue;
          const d = Math.hypot(sp[i].x - sp[j].x, sp[i].y - sp[j].y);
          if (d > LD) continue;
          fx.strokeStyle = `rgba(255,214,165,${0.6 * p * (1 - d / LD)})`;
          fx.lineWidth = 0.6;
          fx.beginPath(); fx.moveTo(sp[i].x, sp[i].y); fx.lineTo(sp[j].x, sp[j].y); fx.stroke();
        }
      sp.forEach((p, i) => {
        const a = 0.08 + np[i] * 0.85;
        const g = fx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5);
        g.addColorStop(0, `rgba(255,246,230,${a})`);
        g.addColorStop(0.4, `rgba(255,190,120,${a * 0.45})`);
        g.addColorStop(1, "rgba(255,190,120,0)");
        fx.fillStyle = g;
        fx.beginPath(); fx.arc(p.x, p.y, 5, 0, Math.PI * 2); fx.fill();
      });
      // вспышки там, где волна сейчас проходит
      if (now - lastFlash > 700 && flashes.length < 4) {
        const hot = np.map((p, i) => (p > 0.6 ? i : -1)).filter((i) => i >= 0);
        if (hot.length) flashes.push({ n: hot[Math.floor(Math.random() * hot.length)], t: 0, rot: Math.random() * Math.PI });
        lastFlash = now;
      }
      flashes = flashes.filter((f) => {
        f.t += dt / 1.4;
        star(sp[f.n].x, sp[f.n].y, Math.min(1, f.t), f.rot, mobile ? 0.7 : 1);
        return f.t < 1;
      });
      // золотые искры срываются с тела и уплывают вверх
      if (Math.random() < dt * 14) {
        const p = sp[Math.floor(Math.random() * sp.length)];
        embers.push({ x: p.x, y: p.y, vx: 6 + Math.random() * 16, vy: -10 - Math.random() * 18, t: 0 });
      }
      embers = embers.filter((e) => {
        e.t += dt / 3;
        e.x += e.vx * dt; e.y += e.vy * dt;
        const a = Math.sin(Math.min(1, e.t) * Math.PI) * 0.8;
        fx.fillStyle = `rgba(255,214,160,${a})`;
        fx.beginPath(); fx.arc(e.x, e.y, 1.1, 0, Math.PI * 2); fx.fill();
        return e.t < 1;
      });
      fx.globalCompositeOperation = "source-over";

      // фразы рядом с фигурой
      if (now - lastPhrase > 3400 && phrases.length < 2) {
        const pool = PHRASES.filter((p) => !recent.includes(p));
        const text = pool[Math.floor(Math.random() * pool.length)];
        const cand = sp
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => (mobile ? p.y < rect.y + rect.h * 0.4 : p.x > rect.x + rect.w * 0.5))
          // не рядом с уже видимой фразой — чтобы не слипались
          .filter(({ p }) => phrases.every((q) => Math.abs(sp[q.n].y - p.y) > 70));
        if (cand.length) {
          const { i } = cand[Math.floor(Math.random() * cand.length)];
          phrases.push({ n: i, text, t: 0 });
          flashes.push({ n: i, t: 0, rot: Math.random() * Math.PI });
          recent.push(text);
          if (recent.length > 3) recent.shift();
        }
        lastPhrase = now;
      }
      fx.textBaseline = "middle";
      phrases = phrases.filter((p) => {
        p.t += dt / 4.5;
        const k = Math.min(1, p.t), a = Math.min(1, k / 0.18) * Math.min(1, (1 - k) / 0.3);
        const size = mobile ? 12 : 14;
        fx.font = `500 ${size}px Onest, sans-serif`;
        (fx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.14em";
        const text = p.text.toUpperCase(), tw = fx.measureText(text).width;
        const x0 = sp[p.n].x, y0 = sp[p.n].y - k * 14;
        const right = x0 + 40 + tw < w - 16;
        let tx = right ? x0 + 40 : x0 - 40 - tw;
        tx = Math.max(16, Math.min(w - 16 - tw, tx));
        fx.textAlign = "left";
        fx.strokeStyle = `rgba(255,210,165,${0.4 * a})`;
        fx.lineWidth = 0.8;
        fx.beginPath(); fx.moveTo(sp[p.n].x, sp[p.n].y); fx.lineTo(right ? tx - 6 : tx + tw + 6, y0); fx.stroke();
        fx.shadowColor = "rgba(255,190,130,0.8)";
        fx.shadowBlur = 14;
        fx.fillStyle = `rgba(255,240,224,${0.92 * a})`;
        fx.fillText(text, tx, y0);
        fx.shadowBlur = 0;
        return p.t < 1;
      });

      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    let lw = window.innerWidth;
    const onResize = () => { if (window.innerWidth !== lw) { lw = window.innerWidth; layout(); } };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("timeupdate", onTime);
      video.pause();
      video.removeAttribute("src");
      texture.dispose();
      mat.dispose();
      plane.geometry.dispose();
      renderer.dispose();
      host.replaceChildren();
    };
  }, []);

  return <div ref={wrap} className={className} aria-hidden="true" />;
}
