"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, loadImageData, runLoop } from "./shared";

/**
 * Балерина из светящейся пыли в палитре сайта (локальная версия, не публикуется).
 * Источник — атлас кадров танца с настоящей светотенью. Частиц больше там, где в кадре перепад света:
 * контур тела, линии мышц, складки — фигура «нарисована» светом, тонкая и детальная.
 * По телу медленно гуляют пятна, где пыль на мгновение рассыпается и снова собирается.
 * На теле вспыхивают звёздочки, сквозь тело идут тонкие нейронные нити.
 */

const ATLAS = { cols: 12, fw: 240, fh: 228, frames: 144, fps: 6 };
const FH = 4.4; // высота кадра в единицах сцены
const FW = (FH * ATLAS.fw) / ATLAS.fh;

type Frame = { px: Int16Array; lum: Float32Array; edge: Float32Array; depth: Float32Array; cdf: Float32Array; n: number; cx: number };

const VERT = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aLum;
  attribute float aEdge;
  attribute float aAlpha;
  attribute float aRand;
  varying float vLum;
  varying float vEdge;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vLum = aLum;
    vEdge = aEdge;
    vAlpha = aAlpha;
    gl_PointSize = uSize * uPixelRatio * (0.45 + aLum * 0.35 + aEdge * 0.55) * (0.75 + aRand * 0.5) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  varying float vLum;
  varying float vEdge;
  varying float vAlpha;
  vec3 palette(float t) {
    vec3 violet = vec3(0.40, 0.30, 0.82);
    vec3 rose = vec3(0.92, 0.50, 0.60);
    vec3 peach = vec3(1.00, 0.76, 0.52);
    vec3 white = vec3(1.00, 0.96, 0.90);
    if (t < 0.33) return mix(violet, rose, t / 0.33);
    if (t < 0.66) return mix(rose, peach, (t - 0.33) / 0.33);
    return mix(peach, white, (t - 0.66) / 0.34);
  }
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.12, d);
    // контуры и линии мышц ярче, ровные места тише — тело читается светом, без выгорания
    float tone = clamp(vLum * 0.75 + vEdge * 0.6, 0.0, 1.0);
    float alpha = a * vAlpha * (0.1 + 0.35 * vLum + 0.7 * vEdge);
    gl_FragColor = vec4(palette(tone) * alpha, alpha);
  }
`;

/** Звёздочка с лучами — текстура для вспышек. */
function starTexture() {
  const s = 256, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const core = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.16);
  core.addColorStop(0, "rgba(255,248,236,1)");
  core.addColorStop(0.4, "rgba(255,200,140,0.5)");
  core.addColorStop(1, "rgba(255,200,140,0)");
  g.fillStyle = core;
  g.fillRect(0, 0, s, s);
  g.translate(s / 2, s / 2);
  for (let r = 0; r < 8; r++) {
    const len = r % 2 === 0 ? s * 0.48 : s * 0.2;
    const lg = g.createLinearGradient(0, 0, len, 0);
    lg.addColorStop(0, "rgba(255,244,226,0.95)");
    lg.addColorStop(1, "rgba(255,210,160,0)");
    g.strokeStyle = lg;
    g.lineWidth = r % 2 === 0 ? 3 : 2;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(len, 0);
    g.stroke();
    g.rotate(Math.PI / 4);
  }
  return new THREE.CanvasTexture(c);
}

export default function NeuroBallet({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current!;
    const stage = createStage(host);
    const { scene, camera, mouse, size, dpr } = stage;
    const mobile = window.innerWidth < 860;

    const figure = new THREE.Group();
    scene.add(figure);

    const N = mobile ? 18000 : 38000;
    const pos = new Float32Array(N * 3), aLum = new Float32Array(N), aEdge = new Float32Array(N), aAlpha = new Float32Array(N), aRand = new Float32Array(N);
    const u = new Float32Array(N), jx = new Float32Array(N), jy = new Float32Array(N), jz = new Float32Array(N), ang = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      u[i] = Math.random();
      jx[i] = Math.random() - 0.5;
      jy[i] = Math.random() - 0.5;
      jz[i] = Math.random() * 2 - 1;
      aRand[i] = Math.random();
      ang[i] = Math.random() * Math.PI * 2;
      pos[i * 3 + 1] = -10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aLum", new THREE.BufferAttribute(aLum, 1));
    geo.setAttribute("aEdge", new THREE.BufferAttribute(aEdge, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(aAlpha, 1));
    geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uSize: { value: mobile ? 13 : 12 }, uPixelRatio: { value: dpr } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    // частицы двигаются каждый кадр — границы, посчитанные при создании, неверны, отсечение выключаем
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    figure.add(points);

    // нейронные нити сквозь тело
    const NODES = mobile ? 60 : 120;
    const nodeIdx = Array.from({ length: NODES }, () => Math.floor(Math.random() * N));
    const MAXL = 180;
    const linePos = new Float32Array(MAXL * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lineGeo.setDrawRange(0, 0);
    const lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: new THREE.Color("#ffc58a"), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    lines.frustumCulled = false;
    figure.add(lines);

    // вспышки-звёздочки
    const starTex = starTexture();
    const stars = Array.from({ length: 5 }, () => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      figure.add(sp);
      return { sp, i: -1, t: 1, rot: 0 };
    });

    let frames: Frame[] = [];
    let disposed = false;
    loadImageData("/hero/ballet.png").then((img) => {
      if (!disposed) frames = parseAtlas(img);
    });

    const layout = () => {
      stage.resize();
      // в кадре атласа балерина с поднятыми руками занимает почти всю высоту
      if (size.w < 860) {
        figure.scale.setScalar((size.visH * 0.62) / FH);
        figure.position.set(0, size.visH * 0.08, 0);
      } else {
        figure.scale.setScalar((size.visH * 0.84) / FH);
        figure.position.set(size.visW * 0.21, -size.visH * 0.01, 0);
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
    const A = [0, 0, 0, 0, 0], B = [0, 0, 0, 0, 0];
    const target = (f: Frame, i: number, out: number[]) => {
      // выбор точки кадра с весом по свету и контрасту (двоичный поиск по накопленной сумме)
      const r = u[i] * f.cdf[f.n - 1];
      let lo = 0, hi = f.n - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (f.cdf[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      // f.cx — сглаженный центр фигуры: балерина остаётся на месте, хотя по сцене она перемещается
      const px = f.px[lo * 2] + 0.5 + jx[i] * 0.8 - f.cx + ATLAS.fw / 2, py = f.px[lo * 2 + 1] + 0.5 + jy[i] * 0.8;
      out[0] = (px / ATLAS.fw - 0.5) * FW;
      out[1] = (0.5 - py / ATLAS.fh) * FH;
      out[2] = f.depth[lo];
      out[3] = f.lum[lo];
      out[4] = f.edge[lo];
    };
    let lastFlash = 0;

    const stop = runLoop(host, (t, dt) => {
      mouse.x += (mouse.tx - mouse.x) * 0.035;
      mouse.y += (mouse.ty - mouse.y) * 0.035;
      figure.rotation.y = mouse.x * 0.22 + Math.sin(t * 0.25) * 0.04;
      figure.rotation.x = mouse.y * 0.05;

      if (frames.length) {
        // для проверки на скриншотах можно задать момент танца: window.__balletT = 10
        const ft = ((window as unknown as { __balletT?: number }).__balletT ?? t) * ATLAS.fps;
        const f0 = Math.floor(ft) % frames.length, f1 = (f0 + 1) % frames.length, k = ft - Math.floor(ft);
        const ks = k * k * (3 - 2 * k);
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
        const ease = 1 - Math.pow(0.00002, dt); // короткий шлейф — силуэт не размывается
        for (let i = 0; i < N; i++) {
          target(frames[f0], i, A);
          target(frames[f1], i, B);
          let tx = A[0] + (B[0] - A[0]) * ks, ty = A[1] + (B[1] - A[1]) * ks;
          const dep = A[2] + (B[2] - A[2]) * ks, lum = A[3] + (B[3] - A[3]) * ks, edge = A[4] + (B[4] - A[4]) * ks;
          let tz = (dep - 0.25) * 0.6 + jz[i] * dep * 0.1;
          // чередующееся рассеивание: по телу медленно гуляют пятна, где пыль расходится и тает
          const n = 0.5 + 0.5 * Math.sin(tx * 2.4 + t * 0.35) * Math.sin(ty * 1.8 - t * 0.28 + 1.3);
          const s = n < 0.62 ? 0 : (n - 0.62) / 0.38;
          let al = 1;
          if (s > 0) {
            const spread = s * s * (0.04 + aRand[i] * 0.32);
            tx += Math.cos(ang[i]) * spread + spread * 0.4;
            ty += Math.sin(ang[i]) * spread + spread * 0.3;
            tz += (aRand[i] - 0.5) * spread;
            al = 1 - s * 0.65;
          }
          const j = i * 3;
          pos[j] += (tx - pos[j]) * ease;
          pos[j + 1] += (ty - pos[j + 1]) * ease;
          pos[j + 2] += (tz - pos[j + 2]) * ease;
          // курсор расталкивает пыль
          const dx = pos[j] - mx, dy = pos[j + 1] - my, d2 = dx * dx + dy * dy;
          if (d2 < 0.09) {
            const f = (0.09 - d2) * 3;
            pos[j] += dx * f;
            pos[j + 1] += dy * f;
          }
          aLum[i] = lum;
          aEdge[i] = edge;
          aAlpha[i] = al;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aLum.needsUpdate = true;
        geo.attributes.aEdge.needsUpdate = true;
        geo.attributes.aAlpha.needsUpdate = true;

        // нити между близкими нейронами на теле
        let L = 0;
        for (let a = 0; a < nodeIdx.length && L < MAXL; a++) {
          const ia = nodeIdx[a] * 3;
          for (let b = a + 1; b < nodeIdx.length && L < MAXL; b++) {
            const ib = nodeIdx[b] * 3;
            const dx = pos[ia] - pos[ib], dy = pos[ia + 1] - pos[ib + 1];
            if (dx * dx + dy * dy > 0.04) continue;
            linePos.set([pos[ia], pos[ia + 1], pos[ia + 2], pos[ib], pos[ib + 1], pos[ib + 2]], L * 6);
            L++;
          }
        }
        lineGeo.setDrawRange(0, L * 2);
        lineGeo.attributes.position.needsUpdate = true;

        // вспышки на контурах тела
        if (t - lastFlash > 1.2) {
          const free = stars.find((st) => st.t >= 1);
          if (free) {
            for (let tries = 0; tries < 40; tries++) {
              const i = Math.floor(Math.random() * N);
              if (aEdge[i] > 0.5 && aAlpha[i] > 0.9) {
                free.i = i;
                free.t = 0;
                free.rot = Math.random() * Math.PI;
                lastFlash = t;
                break;
              }
            }
          }
        }
        for (const st of stars) {
          if (st.t >= 1) {
            st.sp.material.opacity = 0;
            continue;
          }
          st.t += dt / 1.4;
          const kk = Math.min(1, st.t);
          st.sp.position.set(pos[st.i * 3], pos[st.i * 3 + 1], pos[st.i * 3 + 2] + 0.05);
          const sc = 0.2 + Math.sqrt(kk) * 0.45;
          st.sp.scale.set(sc, sc, 1);
          st.sp.material.rotation = st.rot;
          st.sp.material.opacity = Math.pow(1 - kk, 1.4) * 0.9;
        }
      }
      stage.renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      stop();
      window.removeEventListener("resize", onResize);
      starTex.dispose();
      stage.dispose();
    };
  }, []);

  return <div ref={wrap} className={className} aria-hidden="true" />;
}

/**
 * Разбор атласа: точки фигуры, их яркость, контраст (контуры и линии мышц),
 * «глубина» (размытая яркость) и накопленные веса для выбора точек.
 */
function parseAtlas(img: ImageData): Frame[] {
  const { cols, fw, fh, frames } = ATLAS;
  const L = new Float32Array(fw * fh), T = new Float32Array(fw * fh), D = new Float32Array(fw * fh);
  const out: Frame[] = [];
  const R = 5;
  const at = (x: number, y: number) => L[Math.min(fh - 1, Math.max(0, y)) * fw + Math.min(fw - 1, Math.max(0, x))];
  for (let f = 0; f < frames; f++) {
    const ox = (f % cols) * fw, oy = Math.floor(f / cols) * fh;
    let hi = 0.01;
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        const v = img.data[((oy + y) * img.width + ox + x) * 4] / 255;
        L[y * fw + x] = v;
        if (v > hi) hi = v;
      }
    // яркость кадра нормируем — сцена в видео тёмная
    for (let i = 0; i < L.length; i++) L[i] = Math.min(1, L[i] / (hi * 0.85));
    for (let y = 0; y < fh; y++) {
      let s = 0;
      for (let k = -R; k <= R; k++) s += L[y * fw + Math.min(fw - 1, Math.max(0, k))];
      for (let x = 0; x < fw; x++) {
        T[y * fw + x] = s / (2 * R + 1);
        s += L[y * fw + Math.min(fw - 1, x + R + 1)] - L[y * fw + Math.max(0, x - R)];
      }
    }
    for (let x = 0; x < fw; x++) {
      let s = 0;
      for (let k = -R; k <= R; k++) s += T[Math.min(fh - 1, Math.max(0, k)) * fw + x];
      for (let y = 0; y < fh; y++) {
        D[y * fw + x] = s / (2 * R + 1);
        s += T[Math.min(fh - 1, y + R + 1) * fw + x] - T[Math.max(0, y - R) * fw + x];
      }
    }
    const px: number[] = [], lum: number[] = [], edge: number[] = [], dep: number[] = [], cdf: number[] = [];
    let acc = 0;
    // пол и отражение снизу не берём
    for (let y = 0; y < fh * 0.94; y++)
      for (let x = 0; x < fw; x++) {
        const v = L[y * fw + x];
        // контраст: перепад света — контур тела, линии мышц, складки пачки
        const e = Math.min(1, (Math.abs(at(x + 1, y) - at(x - 1, y)) + Math.abs(at(x, y + 1) - at(x, y - 1))) * 1.6);
        // отсекаем мягкое свечение вокруг тела — из-за него фигура выглядела толще
        if (v < 0.3 && !(e > 0.35 && v > 0.2)) continue;
        px.push(x, y);
        lum.push(v);
        edge.push(e);
        dep.push(Math.min(1, D[y * fw + x] * 1.6));
        acc += 0.25 * Math.pow(v, 1.6) + 1.4 * e * e + 0.02;
        cdf.push(acc);
      }
    if (!lum.length) px.push(fw / 2, fh / 2), lum.push(0), edge.push(0), dep.push(0), cdf.push(1);
    let sx = 0, sw = 0;
    for (let k = 0; k < lum.length; k++) { sx += px[k * 2] * lum[k]; sw += lum[k]; }
    out.push({
      px: Int16Array.from(px), lum: Float32Array.from(lum), edge: Float32Array.from(edge), depth: Float32Array.from(dep),
      cdf: Float32Array.from(cdf), n: lum.length, cx: sw ? sx / sw : fw / 2,
    });
  }
  // сглаживаем центр по соседним кадрам, чтобы компенсация не дёргалась
  const raw = out.map((f) => f.cx);
  out.forEach((f, i) => {
    let s = 0, c = 0;
    for (let k = -6; k <= 6; k++) { s += raw[(i + k + raw.length) % raw.length]; c++; }
    f.cx = s / c;
  });
  return out;
}
