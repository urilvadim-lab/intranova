import * as THREE from "three";

/* Общие части псевдо-3D образов первого экрана: сцена, пыль, нейронная сеть, слова. */

export const WORDS = [
  "тело", "чувство", "дыхание", "внимание", "память", "сигнал", "ресурс", "покой", "связь",
  "импульс", "ощущение", "граница", "доверие", "сознание", "пульс", "ритм", "образ", "смысл",
  "отклик", "контакт", "присутствие", "опора", "тишина", "нежность", "чувствительность",
  "голос", "кожа", "сердце", "движение", "свобода", "тепло", "радость",
];

export const GOLD = new THREE.Color("#ffc983");
export const WHITE = new THREE.Color("#fff3e2");
export const VIOLET = new THREE.Color("#6d55e6");

export type Mouse = { x: number; y: number; tx: number; ty: number; px: number; py: number; moved: number };

export function createStage(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  camera.position.set(0, 0, 8);
  const mouse: Mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999, moved: 0 };
  const size = { w: 0, h: 0, visW: 0, visH: 0 };

  const resize = () => {
    const r = host.getBoundingClientRect();
    size.w = r.width;
    size.h = r.height;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
    size.visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    size.visW = size.visH * camera.aspect;
  };
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    mouse.px = e.clientX - r.left;
    mouse.py = e.clientY - r.top;
    mouse.moved = performance.now();
  };
  window.addEventListener("pointermove", onMove);

  /** Проекция точки из локальных координат объекта в пиксели экрана. */
  const v = new THREE.Vector3();
  const toScreen = (obj: THREE.Object3D, x: number, y: number, z: number) => {
    v.set(x, y, z).applyMatrix4(obj.matrixWorld).project(camera);
    return { x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h };
  };

  const dispose = () => {
    window.removeEventListener("pointermove", onMove);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | undefined;
      if (mat) mat.dispose();
    });
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { renderer, scene, camera, dpr, mouse, size, resize, toScreen, dispose };
}

/* ---------- фоновая пыль ---------- */

export function createDust(count: number, dpr: number) {
  const pos = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 28;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 2] = -Math.random() * 16 + 2.5;
    rnd[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: dpr }, uA: { value: GOLD }, uB: { value: VIOLET } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPixelRatio;
      attribute float aRand; varying float vA; varying float vR;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.12 + aRand * 20.0) * 0.3;
        p.x += cos(uTime * 0.09 + aRand * 13.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = (0.2 + aRand * 0.8) * smoothstep(24.0, 6.0, -mv.z) * (0.55 + 0.45 * sin(uTime * 0.7 + aRand * 40.0));
        vR = aRand;
        gl_PointSize = (5.0 + aRand * 14.0) * uPixelRatio / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB; varying float vA; varying float vR;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * vA * 0.5;
        gl_FragColor = vec4(mix(uB, uA, step(0.6, vR)) * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { points: new THREE.Points(geo, mat), mat };
}

/* ---------- нейронная сеть: узлы, связи и бегущие импульсы ---------- */

export function createNeurons(dpr: number, opts: { count: number; rx: number; ry: number; rz: number; link: number }) {
  const group = new THREE.Group();
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < opts.count; i++) {
    // узлы в оболочке вокруг образа, гуще по краям
    const a = Math.random() * Math.PI * 2;
    const r = 0.75 + Math.random() * 0.45;
    nodes.push(new THREE.Vector3(Math.cos(a) * opts.rx * r, Math.sin(a) * opts.ry * r, (Math.random() - 0.5) * 2 * opts.rz));
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) if (nodes[i].distanceTo(nodes[j]) < opts.link) edges.push([i, j]);

  const lp = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], k) => {
    lp.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], k * 6);
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
  const lines = new THREE.LineSegments(
    lg,
    new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  group.add(lines);

  const np = new Float32Array(nodes.length * 3);
  nodes.forEach((n, i) => np.set([n.x, n.y, n.z], i * 3));
  const PULSES = 26;
  const pp = new Float32Array(PULSES * 3);
  const pa = new Float32Array(PULSES);
  const glowMat = (size: number) =>
    new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: dpr }, uColor: { value: GOLD }, uSize: { value: size } },
      vertexShader: /* glsl */ `
        uniform float uPixelRatio; uniform float uSize; attribute float aA; varying float vA;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aA;
          gl_PointSize = uSize * uPixelRatio / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; varying float vA;
        void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
          float a = pow(smoothstep(0.5, 0.0, d), 2.0) * vA; gl_FragColor = vec4(uColor * a, a); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(np, 3));
  ng.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(nodes.length).fill(0.45), 1));
  group.add(new THREE.Points(ng, glowMat(26)));
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  pg.setAttribute("aA", new THREE.BufferAttribute(pa, 1));
  group.add(new THREE.Points(pg, glowMat(70)));

  const pulses = Array.from({ length: PULSES }, () => ({ e: Math.floor(Math.random() * Math.max(1, edges.length)), t: Math.random(), s: 0.25 + Math.random() * 0.5, dir: Math.random() < 0.5 }));
  const update = (dt: number) => {
    if (!edges.length) return;
    pulses.forEach((p, i) => {
      p.t += dt * p.s;
      if (p.t >= 1) {
        // импульс перескакивает на соседнюю связь — сигнал бежит по сети
        const end = p.dir ? edges[p.e][0] : edges[p.e][1];
        const next = edges.map((e, k) => (e[0] === end || e[1] === end ? k : -1)).filter((k) => k >= 0 && k !== p.e);
        p.e = next.length && Math.random() < 0.8 ? next[Math.floor(Math.random() * next.length)] : Math.floor(Math.random() * edges.length);
        p.dir = edges[p.e][1] === end;
        p.t = 0;
      }
      const [a, b] = edges[p.e];
      const A = p.dir ? nodes[b] : nodes[a];
      const B = p.dir ? nodes[a] : nodes[b];
      pp[i * 3] = A.x + (B.x - A.x) * p.t;
      pp[i * 3 + 1] = A.y + (B.y - A.y) * p.t;
      pp[i * 3 + 2] = A.z + (B.z - A.z) * p.t;
      pa[i] = Math.sin(p.t * Math.PI) * 0.9;
    });
    pg.attributes.position.needsUpdate = true;
    pg.attributes.aA.needsUpdate = true;
  };
  return { group, update };
}

/* ---------- плавные завихрения (curl-поле из гладкой функции) ---------- */

export function flowPsi(x: number, y: number, t: number) {
  return (
    Math.sin(1.3 * x + 0.35 * t + Math.sin(1.1 * y + 0.2 * t)) * Math.cos(1.5 * y - 0.25 * t) +
    0.5 * Math.sin(2.7 * x - 2.1 * y + 0.5 * t) +
    0.25 * Math.cos(4.3 * y + 3.1 * x - 0.6 * t)
  );
}
/** Скорость без «стоков»: частицы закручиваются, но не слипаются в точки. */
export function curl(x: number, y: number, t: number, out: number[]) {
  const e = 0.01;
  out[0] = (flowPsi(x, y + e, t) - flowPsi(x, y - e, t)) / (2 * e);
  out[1] = -(flowPsi(x + e, y, t) - flowPsi(x - e, y, t)) / (2 * e);
}

/* ---------- текучие нейроны на фоне: искры со светящимися хвостами ---------- */

export function createFlow(count: number, dpr = 1) {
  const W = 18, H = 11;
  const p = new Float32Array(count * 2);
  const life = new Float32Array(count);
  const depth = new Float32Array(count); // 0 — далеко, 1 — близко
  for (let i = 0; i < count; i++) {
    p[i * 2] = (Math.random() - 0.5) * W;
    p[i * 2 + 1] = (Math.random() - 0.5) * H;
    life[i] = Math.random();
    depth[i] = Math.pow(Math.random(), 1.6);
  }
  const seg = new Float32Array(count * 6);
  const alpha = new Float32Array(count * 2);
  const tone = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) tone[i * 2] = tone[i * 2 + 1] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(seg, 3));
  geo.setAttribute("aA", new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute("aT", new THREE.BufferAttribute(tone, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uA: { value: GOLD }, uB: { value: new THREE.Color("#ff9d8a") } },
    vertexShader: /* glsl */ `attribute float aA; attribute float aT; varying float vA; varying float vT;
      void main(){ vA = aA; vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform vec3 uA; uniform vec3 uB; varying float vA; varying float vT;
      void main(){ gl_FragColor = vec4(mix(uA, uB, vT * 0.6) * vA, vA); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geo, mat);
  const group = new THREE.Group();
  group.add(lines);

  // светящиеся «головки» искр
  const hp = new Float32Array(count * 3), ha = new Float32Array(count), hs = new Float32Array(count);
  for (let i = 0; i < count; i++) hs[i] = 10 + depth[i] * 34;
  const hg = new THREE.BufferGeometry();
  hg.setAttribute("position", new THREE.BufferAttribute(hp, 3));
  hg.setAttribute("aA", new THREE.BufferAttribute(ha, 1));
  hg.setAttribute("aS", new THREE.BufferAttribute(hs, 1));
  hg.setAttribute("aT", new THREE.BufferAttribute(Float32Array.from({ length: count }, (_, i) => tone[i * 2]), 1));
  group.add(
    new THREE.Points(
      hg,
      new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: dpr }, uA: { value: GOLD }, uB: { value: new THREE.Color("#ff9d8a") } },
        vertexShader: /* glsl */ `uniform float uPixelRatio; attribute float aA; attribute float aS; attribute float aT; varying float vA; varying float vT;
          void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vA = aA; vT = aT; gl_PointSize = aS * uPixelRatio / -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `uniform vec3 uA; uniform vec3 uB; varying float vA; varying float vT;
          void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; float a = pow(smoothstep(0.5,0.0,d),2.0)*vA;
            gl_FragColor = vec4(mix(uA, uB, vT*0.6)*a, a); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );

  const v = [0, 0];
  const update = (t: number, dt: number) => {
    for (let i = 0; i < count; i++) {
      let x = p[i * 2], y = p[i * 2 + 1];
      const dep = depth[i];
      curl(x * 0.3 + dep * 3, y * 0.3, t * 0.35, v);
      // ближние искры быстрее и крупнее — параллакс слоёв
      const sp = 0.18 + dep * 0.45;
      const vx = v[0] * sp, vy = v[1] * sp + 0.04;
      x += vx * dt;
      y += vy * dt;
      life[i] += dt * (0.05 + dep * 0.05);
      if (life[i] > 1 || Math.abs(x) > W / 2 || Math.abs(y) > H / 2) {
        x = (Math.random() - 0.5) * W;
        y = (Math.random() - 0.5) * H;
        life[i] = 0;
      }
      p[i * 2] = x;
      p[i * 2 + 1] = y;
      const z = -6 + dep * 5.5;
      const k = i * 6, tail = 0.45 + dep * 0.4;
      seg[k] = x; seg[k + 1] = y; seg[k + 2] = z;
      seg[k + 3] = x - vx * tail; seg[k + 4] = y - vy * tail; seg[k + 5] = z;
      const a = Math.sin(life[i] * Math.PI) * (0.12 + dep * 0.4);
      alpha[i * 2] = a;
      alpha[i * 2 + 1] = 0;
      hp[i * 3] = x; hp[i * 3 + 1] = y; hp[i * 3 + 2] = z;
      ha[i] = a * 1.6;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aA.needsUpdate = true;
    hg.attributes.position.needsUpdate = true;
    hg.attributes.aA.needsUpdate = true;
  };
  return { lines: group, update };
}

/* ---------- слова, проступающие на образе ---------- */

export function createWords(layer: HTMLElement) {
  return (x: number, y: number) => {
    if (layer.childElementCount > 6) return;
    const el = document.createElement("span");
    el.className = "nh-word";
    el.textContent = WORDS[Math.floor(Math.random() * WORDS.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  };
}

/** Цикл отрисовки, который останавливается, когда образ не виден. */
export function runLoop(host: HTMLElement, frame: (t: number, dt: number) => void) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  let visible = true;
  let last = performance.now();
  const start = last;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame((now - start) / 1000, dt);
    if (visible && !reduce) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    last = performance.now();
    if (visible) raf = requestAnimationFrame(loop);
  });
  io.observe(host);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}

export function loadImageData(src: string) {
  return new Promise<ImageData>((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0);
      res(g.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = rej;
    img.src = src;
  });
}
