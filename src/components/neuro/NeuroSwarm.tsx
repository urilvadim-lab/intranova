"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { bez, poseAt, skeleton, type Skeleton } from "./NeuroDancer";
import { createDust, createFlow, createStage, createWords, curl, GOLD, runLoop, VIOLET, WHITE } from "./shared";

/**
 * «Рой»: женская фигура, которую образуют текущие частицы-нейроны.
 * Тело — одна гладкая форма (поле расстояний, части сливаются без швов);
 * частицы плывут внутри по завихрениям, форма их удерживает. Объём — плотностью и светом,
 * без контура; стопы и макушка рассыпаются пылью.
 */

/* ---------- поле расстояний до тела ---------- */

const GX0 = -1.75, GX1 = 1.75, GY0 = -2.5, GY1 = 2.75, CELL = 0.035;
const NX = Math.ceil((GX1 - GX0) / CELL) + 1, NY = Math.ceil((GY1 - GY0) / CELL) + 1;

type Prim = { ax: number; ay: number; bx: number; by: number; r0: number; r1: number } | { cx: number; cy: number; rx: number; ry: number; a: number; e: 1 };

function prims(sk: Skeleton): Prim[] {
  const out: Prim[] = [];
  const cap = (a: { x: number; y: number }, b: { x: number; y: number }, r0: number, r1: number) => out.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, r0, r1 });
  // корпус: бёдра — талия — грудь — плечи
  const S = [0, 0.14, 0.42, 0.62, 0.8, 0.95];
  const R = [0.29, 0.345, 0.2, 0.245, 0.27, 0.2];
  const [ta, tb, tc] = sk.torso;
  for (let i = 0; i < S.length - 1; i++) cap(bez(ta, tb, tc, S[i]), bez(ta, tb, tc, S[i + 1]), R[i], R[i + 1]);
  const L = sk.limbs;
  cap(L.lu[0], L.ru[0], 0.075, 0.075); // линия плеч
  cap(L.neck[0], L.neck[1], 0.066, 0.06);
  out.push({ cx: sk.head.x, cy: sk.head.y, rx: 0.175, ry: 0.235, a: sk.headAng, e: 1 });
  const [ha, hb, hc] = sk.hair;
  const HS = [0, 0.3, 0.65, 1], HR = [0.14, 0.12, 0.085, 0.035];
  for (let i = 0; i < 3; i++) cap(bez(ha, hb, hc, HS[i]), bez(ha, hb, hc, HS[i + 1]), HR[i], HR[i + 1]);
  for (const s of ["l", "r"]) {
    cap(L[s + "u"][0], L[s + "u"][1], 0.082, 0.06);
    cap(L[s + "f"][0], L[s + "f"][1], 0.058, 0.038);
    cap(L[s + "h"][0], L[s + "h"][1], 0.04, 0.018);
    cap(L[s + "t"][0], L[s + "t"][1], 0.165, 0.092);
    cap(L[s + "s"][0], L[s + "s"][1], 0.092, 0.038);
  }
  return out;
}

function primDist(p: Prim, x: number, y: number) {
  if ("e" in p) {
    const c = Math.cos(-p.a), s = Math.sin(-p.a);
    const lx = (x - p.cx) * c - (y - p.cy) * s, ly = (x - p.cx) * s + (y - p.cy) * c;
    return (Math.hypot(lx / p.rx, ly / p.ry) - 1) * Math.min(p.rx, p.ry);
  }
  const bax = p.bx - p.ax, bay = p.by - p.ay, pax = x - p.ax, pay = y - p.ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay || 1)));
  return Math.hypot(pax - bax * h, pay - bay * h) - (p.r0 + (p.r1 - p.r0) * h);
}

// мягкое слияние — плечо перетекает в руку, бедро в талию, без суставов
function smin(a: number, b: number, k: number) {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}

/* ---------- шейдеры ---------- */

const VERT = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aShade;
  attribute float aAlpha;
  attribute float aDot;
  varying float vShade;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vShade = aShade;
    vAlpha = aAlpha;
    gl_PointSize = uSize * uPixelRatio * aDot * (0.75 + aShade * 0.45) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uGold;
  uniform vec3 uViolet;
  uniform vec3 uWhite;
  varying float vShade;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.3, d);
    vec3 col = mix(uViolet, uGold, smoothstep(0.12, 0.62, vShade));
    col = mix(col, uWhite, smoothstep(0.75, 1.0, vShade) * 0.65);
    float alpha = a * vAlpha * (0.3 + 0.8 * vShade);
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

export default function NeuroSwarm({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current!;
    const stage = createStage(host);
    const { scene, camera, mouse, size, dpr } = stage;
    const mobile = window.innerWidth < 860;
    const spawnWord = createWords(layerRef.current!);

    const dust = createDust(mobile ? 700 : 1500, dpr);
    scene.add(dust.points);
    const flow = createFlow(mobile ? 900 : 2200, dpr);
    scene.add(flow.lines);

    const figure = new THREE.Group();
    scene.add(figure);

    /* поле расстояний и его градиент */
    const dist = new Float32Array(NX * NY), gxA = new Float32Array(NX * NY), gyA = new Float32Array(NX * NY);
    const inside = new Int32Array(NX * NY);
    let insideN = 0;
    const buildField = (sk: Skeleton) => {
      const ps = prims(sk);
      insideN = 0;
      for (let j = 0; j < NY; j++) {
        const y = GY0 + j * CELL;
        for (let i = 0; i < NX; i++) {
          const x = GX0 + i * CELL;
          let d = 9;
          for (let k = 0; k < ps.length; k++) {
            const pd = primDist(ps[k], x, y);
            d = pd < d + 0.06 ? smin(d, pd, 0.06) : d;
          }
          const idx = j * NX + i;
          dist[idx] = d;
          if (d < -0.025) inside[insideN++] = idx;
        }
      }
      for (let j = 1; j < NY - 1; j++)
        for (let i = 1; i < NX - 1; i++) {
          const idx = j * NX + i;
          gxA[idx] = (dist[idx + 1] - dist[idx - 1]) / (2 * CELL);
          gyA[idx] = (dist[idx + NX] - dist[idx - NX]) / (2 * CELL);
        }
    };
    const s3 = [0, 0, 0];
    const sample = (x: number, y: number) => {
      const fx = (x - GX0) / CELL, fy = (y - GY0) / CELL;
      if (fx < 1 || fy < 1 || fx >= NX - 2 || fy >= NY - 2) { s3[0] = 1; s3[1] = 0; s3[2] = 0; return s3; }
      const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, k = j * NX + i;
      const bl = (a: Float32Array) => (a[k] * (1 - u) + a[k + 1] * u) * (1 - v) + (a[k + NX] * (1 - u) + a[k + NX + 1] * u) * v;
      s3[0] = bl(dist); s3[1] = bl(gxA); s3[2] = bl(gyA);
      return s3;
    };

    /* частицы */
    const N = mobile ? 15000 : 34000;
    const px = new Float32Array(N), py = new Float32Array(N), rnd = new Float32Array(N), freeT = new Float32Array(N);
    const pos = new Float32Array(N * 3), aShade = new Float32Array(N), aAlpha = new Float32Array(N), aDot = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      rnd[i] = Math.random();
      // зерно разного размера, изредка крупные точки — как в рисунке пунктиром
      aDot[i] = Math.random() < 0.06 ? 1.8 + Math.random() * 1.1 : 0.6 + Math.random() * 0.6;
    }
    const respawn = (i: number) => {
      if (!insideN) return;
      const idx = inside[Math.floor(Math.random() * insideN)];
      px[i] = GX0 + (idx % NX) * CELL + (Math.random() - 0.5) * CELL;
      py[i] = GY0 + Math.floor(idx / NX) * CELL + (Math.random() - 0.5) * CELL;
      freeT[i] = 0;
    };
    const fixedT = () => (window as unknown as { __danceT?: number }).__danceT;
    buildField(skeleton(poseAt(fixedT() ?? 0), 0));
    for (let i = 0; i < N; i++) respawn(i);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aShade", new THREE.BufferAttribute(aShade, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(aAlpha, 1));
    geo.setAttribute("aDot", new THREE.BufferAttribute(aDot, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uSize: { value: mobile ? 13 : 13 }, uPixelRatio: { value: dpr }, uGold: { value: GOLD }, uViolet: { value: VIOLET }, uWhite: { value: WHITE } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    figure.add(new THREE.Points(geo, mat));

    const layout = () => {
      stage.resize();
      if (size.w < 860) {
        const s = (size.visH * 0.56) / 4.8;
        figure.scale.setScalar(s);
        figure.position.set(size.visW * 0.14, size.visH * 0.16 - 0.12 * s, 0);
      } else {
        const s = (size.visH * 0.88) / 4.8;
        figure.scale.setScalar(s);
        figure.position.set(size.visW * 0.2, -0.12 * s, 0);
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

    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3(), local = new THREE.Vector3(), ndc = new THREE.Vector2();
    const v = [0, 0];
    // свет сверху-слева-спереди
    const LX = -0.5, LY = 0.55, LZ = 0.67;
    let lastWord = 0;

    const stop = runLoop(host, (t, dt) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      figure.rotation.y = mouse.x * 0.3 + Math.sin(t * 0.2) * 0.06;
      figure.rotation.x = mouse.y * 0.05;
      dust.points.rotation.y = mouse.x * 0.05;
      dust.mat.uniforms.uTime.value = t;
      flow.update(t, dt);

      const ft = fixedT() ?? t;
      buildField(skeleton(poseAt(ft), ft));

      figure.updateMatrixWorld();
      let mx = 99, my = 99;
      if (performance.now() - mouse.moved < 1500) {
        ndc.set((mouse.px / size.w) * 2 - 1, -(mouse.py / size.h) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectPlane(plane, hit)) {
          local.copy(hit);
          figure.worldToLocal(local);
          mx = local.x;
          my = local.y;
        }
      }

      const pull = Math.min(1, 9 * dt);
      for (let i = 0; i < N; i++) {
        let x = px[i], y = py[i];
        let [d, gx, gy] = sample(x, y);
        if (freeT[i] > 0) {
          // оторвавшаяся пылинка: плывёт вниз-в сторону и гаснет
          freeT[i] += dt * 0.35;
          curl(x * 1.2, y * 1.2, t * 0.4, v);
          x += (v[0] * 0.12 + (rnd[i] - 0.4) * 0.25) * dt;
          y += (v[1] * 0.12 - 0.3 - rnd[i] * 0.2) * dt;
          if (freeT[i] >= 1) { respawn(i); x = px[i]; y = py[i]; }
        } else {
          // течение внутри формы — нейроны свиваются
          curl(x * 2.1, y * 2.1, t * 0.35 + rnd[i] * 0.3, v);
          x += v[0] * 0.026 * dt + (Math.random() - 0.5) * 0.004;
          y += v[1] * 0.026 * dt + (Math.random() - 0.5) * 0.004;
          // форма удерживает частицы чуть внутри края
          if (d > -0.03) {
            const k = (d + 0.03) * pull;
            x -= gx * k;
            y -= gy * k;
          }
          // перерождение внутри тела держит плотность ровной и не даёт частицам налипать на край
          if (d > 0.45 || Math.random() < dt * 0.06) { respawn(i); x = px[i]; y = py[i]; }
          // пылинки отрываются только со стоп и чуть-чуть с макушки
          else if ((y < -1.7 || y > 1.95) && Math.random() < dt * (y < -1.7 ? 0.35 : 0.04)) freeT[i] = 0.001;
        }
        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < 0.1) {
          const f = (0.1 - d2) * 1.6;
          x += dx * f;
          y += dy * f;
        }
        px[i] = x;
        py[i] = y;

        [d, gx, gy] = sample(x, y);
        // объём светом: у края нормаль смотрит наружу, в глубине тела — на зрителя
        const depth = Math.max(0, Math.min(1, -d / 0.15));
        const gl = Math.hypot(gx, gy) || 1;
        const nx = (gx / gl) * (1 - depth), ny = (gy / gl) * (1 - depth), nz = depth + 0.15;
        const nl = Math.hypot(nx, ny, nz);
        aShade[i] = Math.max(0.06, Math.min(1, 0.12 + 0.95 * ((nx * LX + ny * LY + nz * LZ) / nl)));
        const foot = Math.max(0, Math.min(1, (y + 2.3) / 0.7));
        aAlpha[i] = (freeT[i] > 0 ? 1 - freeT[i] : 1) * (0.35 + 0.65 * foot);
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = depth * 0.3 * (rnd[i] * 2 - 1);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aShade.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      stage.renderer.render(scene, camera);

      const now = performance.now();
      if (now - lastWord > 1700) {
        lastWord = now;
        const i = Math.floor(Math.random() * N);
        if (!freeT[i]) {
          const s = stage.toScreen(figure, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          spawnWord(s.x + 30, s.y);
        }
      }
    });

    return () => {
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
