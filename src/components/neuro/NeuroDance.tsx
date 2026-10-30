"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createDust, createNeurons, createStage, createWords, GOLD, loadImageData, runLoop, VIOLET, WHITE } from "./shared";

/**
 * «Тело»: танцующая фигура из частиц. Силуэты кадров танца (атлас dance.png) —
 * цели для частиц; частицы перетекают за движением со шлейфом, часть срывается
 * пылью, курсор расталкивает частицы.
 */

const ATLAS = { cols: 12, rows: 6, fw: 90, fh: 160, frames: 72, fps: 6.8 };
const FIG_H = 4.2;
const FIG_W = (FIG_H * ATLAS.fw) / ATLAS.fh;

const VERT = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aAlpha;
  attribute float aDepth;
  attribute float aRand;
  varying float vAlpha;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vAlpha = aAlpha;
    vDepth = aDepth;
    gl_PointSize = uSize * uPixelRatio * (0.5 + aDepth * 0.8) * (0.7 + aRand * 0.6) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uGold;
  uniform vec3 uViolet;
  uniform vec3 uWhite;
  varying float vAlpha;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d);
    vec3 col = mix(uViolet, uGold, smoothstep(0.05, 0.55, vDepth));
    col = mix(col, uWhite, smoothstep(0.6, 1.0, vDepth) * 0.6);
    float alpha = a * vAlpha * (0.25 + 0.75 * vDepth);
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

type Frame = { px: Int16Array; depth: Float32Array; n: number };

export default function NeuroDance({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current!;
    const stage = createStage(host);
    const { scene, camera, mouse, size, dpr } = stage;
    const mobile = window.innerWidth < 860;
    const spawnWord = createWords(layerRef.current!);

    const dust = createDust(mobile ? 1200 : 2600, dpr);
    scene.add(dust.points);
    const figure = new THREE.Group();
    scene.add(figure);
    const neurons = createNeurons(dpr, { count: mobile ? 34 : 56, rx: 1.55, ry: 2.15, rz: 1.0, link: 0.85 });
    figure.add(neurons.group);

    const N = mobile ? 9000 : 18000;
    const pos = new Float32Array(N * 3);
    const alpha = new Float32Array(N);
    const depthA = new Float32Array(N);
    const rand = new Float32Array(N);
    const u = new Float32Array(N); // стабильная «привязка» частицы к точке силуэта
    const jit = new Float32Array(N * 3);
    const free = new Uint8Array(N); // частицы, которые периодически срываются пылью
    for (let i = 0; i < N; i++) {
      rand[i] = Math.random();
      u[i] = Math.random();
      jit[i * 3] = Math.random();
      jit[i * 3 + 1] = Math.random();
      jit[i * 3 + 2] = Math.random() * 2 - 1;
      free[i] = Math.random() < 0.12 ? 1 : 0;
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute("aDepth", new THREE.BufferAttribute(depthA, 1));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uSize: { value: mobile ? 15 : 16 }, uPixelRatio: { value: dpr }, uGold: { value: GOLD }, uViolet: { value: VIOLET }, uWhite: { value: WHITE } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    figure.add(new THREE.Points(geo, mat));

    let frames: Frame[] = [];
    let disposed = false;
    loadImageData("/hero/dance.png").then((img) => {
      if (disposed) return;
      frames = parseAtlas(img);
    });

    const layout = () => {
      stage.resize();
      if (size.w < 860) {
        figure.position.set(size.visW * 0.12, size.visH * 0.12, 0);
        figure.scale.setScalar((size.visH * 0.62) / FIG_H);
      } else {
        figure.position.set(size.visW * 0.2, -size.visH * 0.02, 0);
        figure.scale.setScalar((size.visH * 0.95) / FIG_H);
      }
    };
    layout();
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      layout();
    };
    window.addEventListener("resize", onResize);

    // курсор в локальных координатах фигуры (плоскость z = 0)
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    const local = new THREE.Vector3();

    const target = (f: Frame, i: number, out: number[]) => {
      const k = Math.floor(u[i] * f.n);
      const px = f.px[k * 2] + jit[i * 3], py = f.px[k * 2 + 1] + jit[i * 3 + 1];
      const dep = f.depth[k];
      out[0] = (px / ATLAS.fw - 0.5) * FIG_W;
      out[1] = (0.5 - py / ATLAS.fh) * FIG_H;
      out[2] = jit[i * 3 + 2] * dep * 0.45;
      out[3] = dep;
    };
    const A = [0, 0, 0, 0], B = [0, 0, 0, 0];
    let lastWord = 0;

    const stop = runLoop(host, (t, dt) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      figure.rotation.y = mouse.x * 0.35 + Math.sin(t * 0.25) * 0.05;
      figure.rotation.x = mouse.y * 0.08;
      dust.points.rotation.y = mouse.x * 0.05;
      dust.mat.uniforms.uTime.value = t;
      neurons.update(dt);

      if (frames.length) {
        // для проверки на скриншотах можно остановить танец на кадре: window.__danceFrame = 30
        const freeze = (window as unknown as { __danceFrame?: number }).__danceFrame;
        const ft = freeze ?? t * ATLAS.fps;
        const f0 = Math.floor(ft) % frames.length, f1 = (f0 + 1) % frames.length, k = ft - Math.floor(ft);
        figure.updateMatrixWorld();
        let mx = 9999, my = 9999;
        if (performance.now() - mouse.moved < 1500) {
          ray.setFromCamera(new THREE.Vector2((mouse.px / size.w) * 2 - 1, -(mouse.py / size.h) * 2 + 1), camera);
          if (ray.ray.intersectPlane(plane, hit)) {
            local.copy(hit);
            figure.worldToLocal(local);
            mx = local.x;
            my = local.y;
          }
        }
        const ease = 1 - Math.pow(0.00002, dt); // плавное догоняние цели — даёт короткий шлейф
        for (let i = 0; i < N; i++) {
          target(frames[f0], i, A);
          target(frames[f1], i, B);
          let tx = A[0] + (B[0] - A[0]) * k, ty = A[1] + (B[1] - A[1]) * k;
          const tz = A[2] + (B[2] - A[2]) * k;
          const dep = A[3] + (B[3] - A[3]) * k;
          let al = 1;
          if (free[i]) {
            // срыв пылью: частица улетает от тела вбок-вниз и гаснет, затем возвращается
            const ph = (t * 0.11 + rand[i] * 9) % 1;
            if (ph > 0.55) {
              const s = (ph - 0.55) / 0.45;
              tx += (rand[i] - 0.35) * 2.2 * s * s + Math.sin(t + rand[i] * 20) * 0.1 * s;
              ty -= 1.4 * s * s * (0.5 + rand[i]);
              al = 1 - s;
            }
          }
          const j = i * 3;
          pos[j] += (tx - pos[j]) * ease;
          pos[j + 1] += (ty - pos[j + 1]) * ease;
          pos[j + 2] += (tz - pos[j + 2]) * ease;
          // курсор расталкивает частицы
          const dx = pos[j] - mx, dy = pos[j + 1] - my, d2 = dx * dx + dy * dy;
          if (d2 < 0.35) {
            const f = (0.35 - d2) * 0.6;
            pos[j] += dx * f;
            pos[j + 1] += dy * f;
          }
          alpha[i] = al;
          depthA[i] = dep;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aAlpha.needsUpdate = true;
        geo.attributes.aDepth.needsUpdate = true;

        const now = performance.now();
        if (now - lastWord > 1500) {
          lastWord = now;
          const i = Math.floor(Math.random() * N);
          if (!free[i]) {
            const s = stage.toScreen(figure, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
            spawnWord(s.x + 40, s.y);
          }
        }
      }
      stage.renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      stop();
      window.removeEventListener("resize", onResize);
      stage.dispose();
      layerRef.current?.replaceChildren();
    };
  }, []);

  return (
    <div ref={wrap} className={className} aria-hidden="true">
      <div ref={layerRef} className="nh-words" />
    </div>
  );
}

/** Разбирает атлас силуэтов: точки фигуры и «глубина» (насколько точка внутри силуэта). */
function parseAtlas(img: ImageData): Frame[] {
  const { cols, fw, fh, frames } = ATLAS;
  const out: Frame[] = [];
  const m = new Float32Array(fw * fh);
  for (let f = 0; f < frames; f++) {
    const ox = (f % cols) * fw, oy = Math.floor(f / cols) * fh;
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) m[y * fw + x] = img.data[((oy + y) * img.width + ox + x) * 4] / 255;
    // глубина: размытая маска — в центре тела больше, у краёв меньше
    const blur = blur2(m, fw, fh, 3);
    const px: number[] = [], dep: number[] = [];
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        const v = m[y * fw + x];
        if (v < 0.7) continue;
        px.push(x, y);
        dep.push(Math.min(1, blur[y * fw + x] * 1.1));
      }
    if (!px.length) px.push(fw / 2, fh / 2), dep.push(0);
    out.push({ px: Int16Array.from(px), depth: Float32Array.from(dep), n: dep.length });
  }
  return out;
}

function blur2(src: Float32Array, W: number, H: number, r: number) {
  const a = new Float32Array(W * H), b = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[y * W + Math.max(0, Math.min(W - 1, x + k))];
      a[y * W + x] = s / (2 * r + 1);
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += a[Math.max(0, Math.min(H - 1, y + k)) * W + x];
      b[y * W + x] = s / (2 * r + 1);
    }
  return b;
}
