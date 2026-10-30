"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createDust, createNeurons, createStage, createWords, GOLD, runLoop, VIOLET, WHITE } from "./shared";

/**
 * «Танец нейронов»: женская фигура из плотной светящейся пыли на собственном скелете.
 * Частицы жёстко привязаны к местам на теле (часть тела, положение вдоль и поперёк),
 * поэтому силуэт чёткий. Часть частиц — нейроны: они связаны линиями, по которым бегут импульсы.
 * Движение — плавные переходы между позами медленного пластичного танца.
 */

/* ---------- позы танца ---------- */
// px — сдвиг таза, sp — наклон корпуса, hd — наклон головы,
// lA/rA — руки от опущенного положения наружу, lB/rB — сгиб локтя,
// lL/rL — ноги наружу, lK/rK — сгиб колена (всё в радианах)
type Pose = [px: number, sp: number, hd: number, lA: number, lB: number, rA: number, rB: number, lL: number, lK: number, rL: number, rK: number];
const POSES: Pose[] = [
  [0.08, -0.06, 0.18, 0.35, 0.3, 0.22, 0.35, 0.05, 0.0, 0.17, -0.14], // контрапост, руки мягко опущены
  [-0.06, 0.12, -0.22, 1.25, 0.45, 2.55, 0.55, 0.12, -0.05, 0.04, 0.1], // правая рука поднимается дугой
  [0.0, 0.0, 0.06, 2.65, 0.5, 2.7, 0.48, 0.08, 0.0, 0.08, 0.0], // «лебедь»: обе руки вверх
  [0.13, -0.24, -0.32, 0.65, 0.65, 2.95, 0.75, 0.04, 0.0, 0.26, -0.22], // наклон в сторону, рука над головой
  [-0.07, 0.06, 0.22, 1.55, 0.25, 1.7, -0.12, 0.22, -0.16, 0.06, 0.0], // раскрытие, руки в стороны
];
const SEG = 3.4; // секунд на переход между позами

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export function poseAt(time: number): Pose {
  const n = POSES.length;
  const f = time / SEG;
  const i = Math.floor(f);
  // сглаженный ход внутри сегмента — ещё мягче на остановках
  const k = f - i;
  const s = k * k * (3 - 2 * k) * 0.6 + k * 0.4;
  const a = POSES[(i - 1 + n * 100) % n], b = POSES[(i + n * 100) % n], c = POSES[(i + 1) % n], d = POSES[(i + 2) % n];
  const out = b.map((_, j) => catmull(a[j], b[j], c[j], d[j], s)) as Pose;
  // постоянное лёгкое дыхание движения
  out[1] += Math.sin(time * 0.9) * 0.025;
  out[2] += Math.sin(time * 0.7 + 1) * 0.04;
  return out;
}

/* ---------- скелет ---------- */

type V2 = { x: number; y: number };
const rot = (a: number, x: number, y: number): V2 => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
const add = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y });
// направление «вниз», повернутое наружу на угол a (side = -1 левая сторона экрана, 1 — правая)
const limbDir = (a: number, side: number): V2 => ({ x: side * Math.sin(a), y: -Math.cos(a) });

export type Skeleton = {
  torso: [V2, V2, V2]; // кривая корпуса: низ таза → грудь → основание шеи
  hair: [V2, V2, V2]; // кривая волос: макушка → за плечом → кончики
  sp: number;
  head: V2;
  headAng: number;
  limbs: Record<string, [V2, V2]>;
};

const LEN = { upper: 0.6, fore: 0.55, hand: 0.17, thigh: 0.95, shin: 0.92 };

export function skeleton(p: Pose, time: number): Skeleton {
  const [px, sp, hd, lA, lB, rA, rB, lL, lK, rL, rK] = p;
  const pelvis = { x: px, y: -0.3 };
  const low = add(pelvis, rot(sp * 0.4, 0, -0.12));
  const chest = add(pelvis, rot(sp, 0, 0.82));
  const neckB = add(chest, rot(sp * 1.25, 0, 0.42));
  const neckT = add(neckB, rot(sp * 1.3 + hd * 0.5, 0, 0.17));
  const headAng = sp * 1.3 + hd;
  const head = add(neckT, rot(headAng, 0, 0.24));
  const torsoAt = (s: number) => bez(low, chest, neckB, s);
  const sh = torsoAt(0.92), hipC = torsoAt(0.07);
  const nS = normalAt(low, chest, neckB, 0.92), nH = normalAt(low, chest, neckB, 0.07);
  const lSh = { x: sh.x - nS.x * 0.27, y: sh.y - nS.y * 0.27 }, rSh = { x: sh.x + nS.x * 0.27, y: sh.y + nS.y * 0.27 };
  const lHip = { x: hipC.x - nH.x * 0.16, y: hipC.y - nH.y * 0.16 }, rHip = { x: hipC.x + nH.x * 0.16, y: hipC.y + nH.y * 0.16 };

  const arm = (s: V2, a: number, b: number, side: number) => {
    const d1 = limbDir(a, side), e = { x: s.x + d1.x * LEN.upper, y: s.y + d1.y * LEN.upper };
    const d2 = limbDir(a + b, side), w = { x: e.x + d2.x * LEN.fore, y: e.y + d2.y * LEN.fore };
    const d3 = limbDir(a + b * 1.4 + 0.15, side), h = { x: w.x + d3.x * LEN.hand, y: w.y + d3.y * LEN.hand };
    return [[s, e], [e, w], [w, h]] as [V2, V2][];
  };
  const leg = (s: V2, a: number, b: number, side: number) => {
    const d1 = limbDir(a, side), k = { x: s.x + d1.x * LEN.thigh, y: s.y + d1.y * LEN.thigh };
    const d2 = limbDir(a + b, side), f = { x: k.x + d2.x * LEN.shin, y: k.y + d2.y * LEN.shin };
    return [[s, k], [k, f]] as [V2, V2][];
  };
  const [lu, lf, lh] = arm(lSh, lA, lB, -1);
  const [ru, rf, rh] = arm(rSh, rA, rB, 1);
  const [lt, ls] = leg(lHip, lL, lK, -1);
  const [rt, rs] = leg(rHip, rL, rK, 1);
  // волосы отстают от движения головы и мягко развеваются
  const sway = Math.sin(time * 0.8) * 0.12 - sp * 0.6 - hd * 0.3;
  const hair: [V2, V2, V2] = [
    add(head, rot(headAng, 0.02, 0.2)),
    add(head, rot(headAng, 0.26 + sway * 0.5, -0.05)),
    add(neckB, { x: 0.22 + sway * 1.6, y: -0.55 + Math.abs(sway) * 0.3 }),
  ];
  return {
    torso: [low, chest, neckB],
    hair,
    sp,
    head,
    headAng,
    limbs: { lu, lf, lh, ru, rf, rh, lt, ls, rt, rs, neck: [neckB, neckT] },
  };
}

export function bez(a: V2, b: V2, c: V2, t: number): V2 {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * b.x + t * t * c.x, y: u * u * a.y + 2 * u * t * b.y + t * t * c.y };
}
function normalAt(a: V2, b: V2, c: V2, t: number): V2 {
  const dx = 2 * (1 - t) * (b.x - a.x) + 2 * t * (c.x - b.x), dy = 2 * (1 - t) * (b.y - a.y) + 2 * t * (c.y - b.y);
  const l = Math.hypot(dx, dy) || 1;
  return { x: dy / l, y: -dx / l };
}

/* ---------- части тела: профили ширины ---------- */

type Part = { key: string; count: number; w: (u: number) => number; flake: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const limbW = (w0: number, w1: number, bulge: number) => (u: number) => lerp(w0, w1, u) * (1 + bulge * Math.sin(Math.PI * u));
// корпус: бёдра — талия — грудь — плечи
export const TORSO_W = [[0, 0.3], [0.14, 0.355], [0.42, 0.205], [0.62, 0.255], [0.8, 0.29], [0.94, 0.27], [1, 0.12]];
const torsoW = (s: number) => {
  for (let i = 1; i < TORSO_W.length; i++)
    if (s <= TORSO_W[i][0]) {
      const [s0, w0] = TORSO_W[i - 1], [s1, w1] = TORSO_W[i];
      const k = (s - s0) / (s1 - s0);
      return lerp(w0, w1, k * k * (3 - 2 * k));
    }
  return 0.12;
};

const PARTS: Part[] = [
  { key: "torso", count: 5200, w: torsoW, flake: 0.02 },
  { key: "head", count: 1300, w: () => 1, flake: 0.06 },
  { key: "hair", count: 1100, w: (u) => 0.13 * (1 - u * 0.55) * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, u * 1.6))), flake: 0.22 },
  { key: "neck", count: 260, w: () => 0.07, flake: 0.01 },
  { key: "lu", count: 760, w: limbW(0.085, 0.06, 0.12), flake: 0.03 },
  { key: "ru", count: 760, w: limbW(0.085, 0.06, 0.12), flake: 0.03 },
  { key: "lf", count: 560, w: limbW(0.058, 0.038, 0.1), flake: 0.05 },
  { key: "rf", count: 560, w: limbW(0.058, 0.038, 0.1), flake: 0.05 },
  { key: "lh", count: 170, w: limbW(0.04, 0.02, 0.2), flake: 0.12 },
  { key: "rh", count: 170, w: limbW(0.04, 0.02, 0.2), flake: 0.12 },
  { key: "lt", count: 1900, w: limbW(0.17, 0.09, 0.06), flake: 0.04 },
  { key: "rt", count: 1900, w: limbW(0.17, 0.09, 0.06), flake: 0.04 },
  { key: "ls", count: 1100, w: limbW(0.095, 0.04, 0.2), flake: 0.32 },
  { key: "rs", count: 1100, w: limbW(0.095, 0.04, 0.2), flake: 0.32 },
];

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
    gl_PointSize = uSize * uPixelRatio * aDot / -mv.z;
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
    float a = smoothstep(0.5, 0.32, d);
    vec3 col = mix(uViolet, uGold, smoothstep(0.15, 0.6, vShade));
    col = mix(col, uWhite, smoothstep(0.72, 1.0, vShade) * 0.7);
    float alpha = a * vAlpha * (0.35 + 0.75 * vShade);
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

export default function NeuroDancer({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current!;
    const stage = createStage(host);
    const { scene, camera, mouse, size, dpr } = stage;
    const mobile = window.innerWidth < 860;
    const spawnWord = createWords(layerRef.current!);
    const density = mobile ? 0.55 : 1;

    const dust = createDust(mobile ? 1100 : 2400, dpr);
    scene.add(dust.points);

    const figure = new THREE.Group();
    scene.add(figure);
    const net = createNeurons(dpr, { count: mobile ? 30 : 48, rx: 1.7, ry: 2.2, rz: 1.0, link: 0.85 });
    figure.add(net.group);

    /* частицы */
    type P = { part: number; u: number; v: number; shade: number; flake: number; dot: number; r: number };
    const ps: P[] = [];
    PARTS.forEach((part, pi) => {
      const n = Math.round(part.count * density);
      for (let i = 0; i < n; i++) {
        let u = Math.random();
        // больше точек там, где часть шире
        if (part.key !== "head") for (let k = 0; k < 4 && Math.random() * 0.4 > part.w(u); k++) u = Math.random();
        // поперёк: часть точек тянется к краям — контур получается чётким
        const r = Math.random();
        const v = r < 0.35 ? Math.sign(Math.random() - 0.5) * (0.82 + Math.random() * 0.18) : Math.random() * 2 - 1;
        // свет сверху-слева: точки на освещённой стороне ярче
        const nz = Math.sqrt(Math.max(0, 1 - v * v));
        let shade = Math.max(0.08, Math.min(1, 0.3 + 0.75 * (-v * 0.55 + nz * 0.8) * 0.85));
        if (part.key === "hair") shade *= 0.8; // волосы — чуть тише тела
        const flakeOn = Math.random() < part.flake * (part.key.endsWith("s") ? u : 1) ? 1 : 0;
        // разный размер точек, иногда крупные — как в зернистом рисунке
        const dot = Math.random() < 0.05 ? 1.9 + Math.random() : 0.7 + Math.random() * 0.6;
        ps.push({ part: pi, u, v, shade, flake: flakeOn, dot, r: Math.random() });
      }
    });
    const N = ps.length;
    const pos = new Float32Array(N * 3);
    const aShade = new Float32Array(N), aAlpha = new Float32Array(N), aDot = new Float32Array(N);
    ps.forEach((p, i) => { aShade[i] = p.shade; aDot[i] = p.dot; aAlpha[i] = 1; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aShade", new THREE.BufferAttribute(aShade, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(aAlpha, 1));
    geo.setAttribute("aDot", new THREE.BufferAttribute(aDot, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uSize: { value: mobile ? 13 : 12 }, uPixelRatio: { value: dpr }, uGold: { value: GOLD }, uViolet: { value: VIOLET }, uWhite: { value: WHITE } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    figure.add(new THREE.Points(geo, mat));

    /* положение частицы на теле в текущей позе */
    const place = (sk: Skeleton, p: P, out: number[]) => {
      const key = PARTS[p.part].key;
      if (key === "head") {
        const a = p.u * Math.PI * 2, rr = Math.sqrt(Math.abs(p.v)) * (p.r < 0.4 ? 1 : 0.98);
        const lx = Math.cos(a) * 0.185 * rr, ly = Math.sin(a) * 0.245 * rr;
        const q = rot(sk.headAng, lx, ly);
        out[0] = sk.head.x + q.x;
        out[1] = sk.head.y + q.y;
        out[2] = Math.sqrt(Math.max(0, 1 - rr * rr)) * 0.17;
        return;
      }
      let cx: number, cy: number, nx: number, ny: number, w: number;
      if (key === "torso" || key === "hair") {
        const [a, b, c] = key === "torso" ? sk.torso : sk.hair;
        const pt = bez(a, b, c, p.u), n = normalAt(a, b, c, p.u);
        cx = pt.x; cy = pt.y; nx = n.x; ny = n.y; w = key === "torso" ? torsoW(p.u) : PARTS[p.part].w(p.u);
        if (key === "hair") {
          // волосы позади тела: чуть дальше по глубине, пряди слегка колышутся
          out[0] = cx + nx * p.v * w + Math.sin(p.r * 40 + p.u * 6) * 0.015 * p.u;
          out[1] = cy + ny * p.v * w;
          out[2] = -0.08 - p.r * 0.06;
          return;
        }
      } else {
        const [A, B] = sk.limbs[key];
        const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1;
        cx = A.x + dx * p.u; cy = A.y + dy * p.u; nx = dy / l; ny = -dx / l; w = PARTS[p.part].w(p.u);
      }
      out[0] = cx + nx * p.v * w;
      out[1] = cy + ny * p.v * w;
      out[2] = Math.sqrt(Math.max(0, 1 - p.v * p.v)) * w * 0.9;
    };

    /* нейроны на теле: узлы и связи внутри одной части тела */
    const NODE_N = mobile ? 260 : 520;
    // узлы — только среди частиц, которые не осыпаются (иначе связи тянутся за пылью)
    const nodes: number[] = [];
    while (nodes.length < NODE_N) {
      const i = Math.floor(Math.random() * N);
      if (!ps[i].flake && PARTS[ps[i].part].key !== "hair") nodes.push(i);
    }
    nodes.forEach((i) => { aDot[i] = 2.4; aShade[i] = Math.max(aShade[i], 0.8); });
    const sk0 = skeleton(poseAt(0), 0);
    const tmp = [0, 0, 0];
    const restPos = nodes.map((i) => { place(sk0, ps[i], tmp); return [tmp[0], tmp[1]]; });
    const edges: [number, number][] = [];
    for (let a = 0; a < nodes.length; a++) {
      const near: [number, number][] = [];
      for (let b = 0; b < nodes.length; b++) {
        if (a === b || ps[nodes[a]].part !== ps[nodes[b]].part) continue;
        const d = Math.hypot(restPos[a][0] - restPos[b][0], restPos[a][1] - restPos[b][1]);
        if (d < 0.32) near.push([d, b]);
      }
      near.sort((x, y) => x[0] - y[0]).slice(0, 2).forEach(([, b]) => { if (a < b) edges.push([a, b]); });
    }
    const linePos = new Float32Array(edges.length * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    figure.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));

    // импульсы бегут по связям тела
    const PUL = mobile ? 24 : 46;
    const pulPos = new Float32Array(PUL * 3), pulA = new Float32Array(PUL);
    const pulGeo = new THREE.BufferGeometry();
    pulGeo.setAttribute("position", new THREE.BufferAttribute(pulPos, 3));
    pulGeo.setAttribute("aA", new THREE.BufferAttribute(pulA, 1));
    figure.add(
      new THREE.Points(
        pulGeo,
        new THREE.ShaderMaterial({
          uniforms: { uPixelRatio: { value: dpr }, uColor: { value: WHITE } },
          vertexShader: /* glsl */ `uniform float uPixelRatio; attribute float aA; varying float vA;
            void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vA = aA; gl_PointSize = 46.0 * uPixelRatio / -mv.z; gl_Position = projectionMatrix * mv; }`,
          fragmentShader: /* glsl */ `uniform vec3 uColor; varying float vA;
            void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; float a = pow(smoothstep(0.5,0.0,d),2.2)*vA; gl_FragColor = vec4(uColor*a, a); }`,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    const pulses = Array.from({ length: PUL }, () => ({ e: Math.floor(Math.random() * Math.max(1, edges.length)), t: Math.random(), s: 0.8 + Math.random() * 1.2, fwd: Math.random() < 0.5 }));

    const layout = () => {
      stage.resize();
      // фигура с поднятыми руками занимает по высоте примерно от -2.2 до 2.4
      if (size.w < 860) {
        const s = (size.visH * 0.56) / 4.6;
        figure.scale.setScalar(s);
        figure.position.set(size.visW * 0.14, size.visH * 0.16 - 0.1 * s, 0);
      } else {
        const s = (size.visH * 0.86) / 4.6;
        figure.scale.setScalar(s);
        figure.position.set(size.visW * 0.2, -0.1 * s, 0);
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
    const out = [0, 0, 0];
    let lastWord = 0;

    const stop = runLoop(host, (t, dt) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      figure.rotation.y = mouse.x * 0.38 + Math.sin(t * 0.2) * 0.08;
      figure.rotation.x = mouse.y * 0.06;
      dust.points.rotation.y = mouse.x * 0.05;
      dust.mat.uniforms.uTime.value = t;
      net.update(dt);

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

      // для проверки на скриншотах можно задать момент танца: window.__danceT = 7
      const fixed = (window as unknown as { __danceT?: number }).__danceT;
      const sk = skeleton(poseAt(fixed ?? t), fixed ?? t);
      for (let i = 0; i < N; i++) {
        const p = ps[i];
        place(sk, p, out);
        let al = 1;
        if (p.flake) {
          // частица отрывается и осыпается вниз-в сторону, затем возвращается на место
          const ph = (t * 0.09 + p.r * 11) % 1;
          if (ph > 0.45) {
            const s = (ph - 0.45) / 0.55;
            out[0] += (p.r - 0.4) * 0.9 * s * s + Math.sin(t * 0.8 + p.r * 30) * 0.05 * s;
            out[1] -= 0.9 * s * s * (0.4 + p.r);
            al = 1 - s;
          }
        }
        // курсор мягко расталкивает пыль
        const dx = out[0] - mx, dy = out[1] - my, d2 = dx * dx + dy * dy;
        if (d2 < 0.12) {
          const f = (0.12 - d2) * 2.2;
          out[0] += dx * f;
          out[1] += dy * f;
        }
        pos[i * 3] = out[0];
        pos[i * 3 + 1] = out[1];
        pos[i * 3 + 2] = out[2];
        aAlpha[i] = al;
      }
      edges.forEach(([a, b], k) => {
        const A = nodes[a] * 3, B = nodes[b] * 3;
        linePos[k * 6] = pos[A]; linePos[k * 6 + 1] = pos[A + 1]; linePos[k * 6 + 2] = pos[A + 2] + 0.01;
        linePos[k * 6 + 3] = pos[B]; linePos[k * 6 + 4] = pos[B + 1]; linePos[k * 6 + 5] = pos[B + 2] + 0.01;
      });
      if (edges.length)
        pulses.forEach((pl, k) => {
          pl.t += dt * pl.s;
          if (pl.t >= 1) {
            const end = pl.fwd ? edges[pl.e][1] : edges[pl.e][0];
            const next: number[] = [];
            edges.forEach((e, j) => { if (j !== pl.e && (e[0] === end || e[1] === end)) next.push(j); });
            pl.e = next.length ? next[Math.floor(Math.random() * next.length)] : Math.floor(Math.random() * edges.length);
            pl.fwd = edges[pl.e][0] === end;
            pl.t = 0;
          }
          const [a, b] = edges[pl.e];
          const A = nodes[pl.fwd ? a : b] * 3, B = nodes[pl.fwd ? b : a] * 3;
          for (let c = 0; c < 3; c++) pulPos[k * 3 + c] = pos[A + c] + (pos[B + c] - pos[A + c]) * pl.t;
          pulA[k] = Math.sin(pl.t * Math.PI);
        });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      lineGeo.attributes.position.needsUpdate = true;
      pulGeo.attributes.position.needsUpdate = true;
      pulGeo.attributes.aA.needsUpdate = true;
      stage.renderer.render(scene, camera);

      const now = performance.now();
      if (now - lastWord > 1600 && nodes.length) {
        lastWord = now;
        const i = nodes[Math.floor(Math.random() * nodes.length)];
        const s = stage.toScreen(figure, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        spawnWord(s.x + 30, s.y);
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
