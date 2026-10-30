"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createDust, createNeurons, createStage, createWords, GOLD, loadImageData, runLoop, VIOLET, WHITE } from "./shared";

/**
 * «Лик»: спокойное женское лицо из частиц (псевдо-3D из карты яркости).
 * Частицы ровно покрывают лицо, глубина — из яркости и овала лица,
 * по краям частицы стекают в пыль, по лицу проходит мягкая полоса света.
 */

const FACE_H = 3.6; // высота образа в единицах сцены
const MASK = { cx: 0.5, cy: 0.6, rx: 0.4, ry: 0.7 }; // овал из подготовки face.png

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScan;
  attribute float aLum;
  attribute float aMask;
  attribute float aRand;
  varying float vLum;
  varying float vAlpha;
  varying float vScan;
  varying float vEdge;

  void main() {
    vec3 p = position;
    float edge = 1.0 - smoothstep(0.2, 0.7, aMask);
    // часть частиц у края отрывается и стекает вправо-вверх, растворяясь
    float life = fract(uTime * 0.045 * (0.6 + aRand) + aRand * 7.0);
    float flies = step(0.45, fract(aRand * 13.7)) * edge;
    p += vec3(1.1 + aRand * 0.8, 0.45 * (aRand - 0.25), 0.4 * (aRand - 0.5)) * life * life * 1.8 * flies;
    // дыхание
    p.z += sin(uTime * 0.7 + position.y * 1.4) * 0.025;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float band = exp(-pow((position.y - uScan) * 2.6, 2.0));
    vScan = band;
    vLum = aLum;
    vEdge = edge;
    vAlpha = (0.2 + 0.8 * aMask) * (1.0 - life * flies);
    gl_PointSize = uSize * uPixelRatio * (0.45 + aLum * 0.85 + band * 0.35) * (0.75 + aRand * 0.5) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uGold;
  uniform vec3 uViolet;
  uniform vec3 uWhite;
  uniform float uTime;
  varying float vLum;
  varying float vAlpha;
  varying float vScan;
  varying float vEdge;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d);
    vec3 col = mix(uViolet, uGold, smoothstep(0.12, 0.62, vLum));
    col = mix(col, uWhite, smoothstep(0.62, 1.0, vLum) * 0.75 + vScan * 0.3);
    col = mix(col, uViolet * 1.3, vEdge * 0.45);
    float alpha = a * vAlpha * (0.3 + 0.95 * vLum + vScan * 0.45);
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

export default function NeuroFace({ className }: { className?: string }) {
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
    const neurons = createNeurons(dpr, { count: mobile ? 34 : 56, rx: 1.95, ry: 2.05, rz: 1.0, link: 0.85 });
    figure.add(neurons.group);

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: mobile ? 24 : 26 },
        uPixelRatio: { value: dpr },
        uScan: { value: 0 },
        uGold: { value: GOLD },
        uViolet: { value: VIOLET },
        uWhite: { value: WHITE },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // точки лица для слов
    const anchors: THREE.Vector3[] = [];
    let disposed = false;

    loadImageData("/hero/face.png").then((img) => {
      if (disposed) return;
      const W = img.width, H = img.height, d = img.data;
      const lum = new Float32Array(W * H);
      const msk = new Float32Array(W * H);
      let lo = 255, hi = 0;
      for (let i = 0; i < W * H; i++) {
        lum[i] = d[i * 4];
        msk[i] = d[i * 4 + 3] / 255;
        if (msk[i] > 0.6) { lo = Math.min(lo, lum[i]); hi = Math.max(hi, lum[i]); }
      }
      // контраст внутри лица растягиваем на 0..1
      // и поднимаем тени (гамма), чтобы веки и впадины не проваливались в черноту
      for (let i = 0; i < W * H; i++) lum[i] = Math.pow(Math.max(0, Math.min(1, (lum[i] - lo) / Math.max(1, hi - lo))), 0.55);
      // размытая яркость — крупные формы рельефа
      const blur = boxBlur(lum, W, H, 7);
      // мягче локальный контраст: закрытые веки и впадины светятся почти как кожа — образ спокойный, не тревожный
      const soft = boxBlur(lum, W, H, 3);
      for (let i = 0; i < W * H; i++) lum[i] = Math.min(1, lum[i] * 0.45 + Math.max(soft[i], blur[i] * 0.95) * 0.6);

      const step = mobile ? 1.9 : 1.35;
      const pos: number[] = [], aL: number[] = [], aM: number[] = [], aR: number[] = [];
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step) {
          const jx = x + Math.random() * step, jy = y + Math.random() * step;
          const i = Math.min(H - 1, Math.floor(jy)) * W + Math.min(W - 1, Math.floor(jx));
          const m = msk[i];
          if (m <= 0.02 || Math.random() > m * (0.55 + 0.45 * lum[i])) continue;
          const u = jx / W, v = jy / H;
          const ex = (u - MASK.cx) / MASK.rx, ey = (v - MASK.cy) / MASK.ry;
          const dome = Math.sqrt(Math.max(0, 1 - ex * ex - ey * ey));
          const z = dome * 0.95 + (blur[i] - 0.5) * 0.4 + (lum[i] - blur[i]) * 0.12;
          const X = (u - 0.5) * FACE_H * (W / H), Y = (0.5 - v) * FACE_H;
          pos.push(X, Y, z);
          aL.push(lum[i]);
          aM.push(m);
          aR.push(Math.random());
          if (m > 0.85 && lum[i] > 0.45 && Math.random() < 0.01) anchors.push(new THREE.Vector3(X, Y, z));
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("aLum", new THREE.Float32BufferAttribute(aL, 1));
      g.setAttribute("aMask", new THREE.Float32BufferAttribute(aM, 1));
      g.setAttribute("aRand", new THREE.Float32BufferAttribute(aR, 1));
      figure.add(new THREE.Points(g, mat));
    });

    const layout = () => {
      stage.resize();
      if (size.w < 860) {
        figure.position.set(size.visW * 0.1, size.visH * 0.28, 0);
        figure.scale.setScalar((size.visH * 0.4) / FACE_H);
      } else {
        figure.position.set(size.visW * 0.21, -size.visH * 0.02, 0);
        figure.scale.setScalar((size.visH * 0.84) / FACE_H);
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

    let lastWord = 0, lastCursorWord = 0;
    const stop = runLoop(host, (t, dt) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      figure.rotation.y = -0.18 + mouse.x * 0.32 + Math.sin(t * 0.3) * 0.03;
      figure.rotation.x = mouse.y * 0.12;
      dust.points.rotation.y = mouse.x * 0.05;
      mat.uniforms.uTime.value = t;
      // полоса света сверху вниз, затем пауза за пределами лица
      mat.uniforms.uScan.value = FACE_H * 0.6 - ((t * 0.09) % 1) * FACE_H * 1.8;
      dust.mat.uniforms.uTime.value = t;
      neurons.update(dt);
      stage.renderer.render(scene, camera);

      const now = performance.now();
      if (anchors.length && now - lastWord > 1300) {
        lastWord = now;
        const a = anchors[Math.floor(Math.random() * anchors.length)];
        const s = stage.toScreen(figure, a.x, a.y, a.z);
        spawnWord(s.x, s.y);
      }
      if (anchors.length && now - mouse.moved < 300 && now - lastCursorWord > 500) {
        let best: { x: number; y: number } | null = null, bd = 100 * 100;
        for (const a of anchors) {
          const s = stage.toScreen(figure, a.x, a.y, a.z);
          const dd = (s.x - mouse.px) ** 2 + (s.y - mouse.py) ** 2;
          if (dd < bd) { bd = dd; best = s; }
        }
        if (best) { lastCursorWord = now; spawnWord(best.x, best.y); }
      }
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

function boxBlur(src: Float32Array, W: number, H: number, r: number) {
  let a = Float32Array.from(src);
  let b = new Float32Array(W * H);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[y * W + Math.max(0, Math.min(W - 1, x))];
      for (let x = 0; x < W; x++) {
        b[y * W + x] = s / (2 * r + 1);
        s += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += b[Math.max(0, Math.min(H - 1, y)) * W + x];
      for (let y = 0; y < H; y++) {
        a[y * W + x] = s / (2 * r + 1);
        s += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x];
      }
    }
  }
  b = a;
  return b;
}
