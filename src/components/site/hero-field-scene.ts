import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  PointLight,
  Raycaster,
  Scene,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

const INK = 0x0e0f0c;
const PAPER = 0xeeece6;
const SIGNAL = 0x2f3bff;
const COLUMNS = 56;
const ROWS = 32;
const SPACING = 1.05;
const RIPPLE_SPEED = 13;
const RIPPLE_LIFE = 3.5;
const MAX_RIPPLES = 4;

type Ripple = { x: number; z: number; t: number };

const isPaused = () => document.documentElement.dataset.motion === 'paused';

export function mountHeroField(el: HTMLElement): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(INK, 1);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'display:block;width:100%;height:100%;cursor:crosshair;opacity:0;transition:opacity .6s ease';
  el.appendChild(canvas);

  const scene = new Scene();
  scene.fog = new Fog(INK, 20, 44);
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(4, 12, 18);
  camera.lookAt(4, 0, 0);
  scene.add(new HemisphereLight(PAPER, INK, 0.7));
  const sun = new DirectionalLight(0xffffff, 1.5);
  sun.position.set(-6, 14, 8);
  scene.add(sun);
  const glow = new PointLight(SIGNAL, 80, 12, 1.4);
  glow.position.set(0, 3, 0);
  scene.add(glow);

  const positions: [number, number][] = [];
  for (let i = 0; i < COLUMNS; i++) {
    for (let j = 0; j < ROWS; j++) {
      positions.push([(i - COLUMNS / 2 + 0.5) * SPACING + 4, (j - ROWS / 2 + 0.5) * SPACING]);
    }
  }
  const lit = positions.map(() => (Math.random() < 0.035 ? 1 : 0));
  const geometry = new BoxGeometry(0.88, 1, 0.88);
  const material = new MeshStandardMaterial({ roughness: 0.5, metalness: 0.15 });
  const mesh = new InstancedMesh(geometry, material, positions.length);
  mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(positions.length * 3), 3);
  scene.add(mesh);

  const base = new Color(0x2a2b25);
  const signal = new Color(SIGNAL);
  const paper = new Color(PAPER);
  const dummy = new Object3D();
  const color = new Color();
  const mouse = { x: 100, z: 100, tx: 100, tz: 100 };
  let ripples: Ripple[] = [];
  const timer = new Timer();
  timer.connect(document);
  const raycaster = new Raycaster();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const hit = new Vector3();
  const pointer = new Vector2();

  const project = (event: PointerEvent) => {
    const box = el.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    ) {
      return null;
    }
    pointer.set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      -((event.clientY - box.top) / box.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.ray.intersectPlane(ground, hit) ? { x: hit.x, z: hit.z } : null;
  };

  const ripple = (x: number, z: number) => {
    ripples.push({ x, z, t: timer.getElapsed() });
    if (ripples.length > MAX_RIPPLES) ripples.shift();
  };

  const frame = () => {
    timer.update();
    const t = timer.getElapsed();
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.z += (mouse.tz - mouse.z) * 0.08;
    glow.position.set(mouse.x, 3, mouse.z);
    ripples = ripples.filter((r) => t - r.t < RIPPLE_LIFE);

    for (let k = 0; k < positions.length; k++) {
      const [x, z] = positions[k];
      const wave = Math.sin(x * 0.26 + t * 0.9) * Math.cos(z * 0.3 + t * 0.7) * 0.4;
      const dx = x - mouse.x;
      const dz = z - mouse.z;
      const hover = Math.exp(-(dx * dx + dz * dz) / 5) * 1.5;
      let rise = 0;
      for (const r of ripples) {
        const age = t - r.t;
        const front = Math.hypot(x - r.x, z - r.z) - age * RIPPLE_SPEED;
        rise += Math.exp((-front * front) / 2.5) * 2 * (1 - age / RIPPLE_LIFE);
      }
      dummy.position.set(x, wave + hover + rise, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(k, dummy.matrix);
      color.copy(base).lerp(signal, Math.min(1, lit[k] + hover * 0.45 + rise * 0.5));
      if (rise > 1.4) color.lerp(paper, Math.min(1, rise - 1.4));
      mesh.setColorAt(k, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
    canvas.style.opacity = '1';
  };

  let visible = false;
  let raf: number | undefined;
  const stop = () => {
    if (raf !== undefined) cancelAnimationFrame(raf);
    raf = undefined;
  };
  const start = () => {
    if (raf !== undefined || !visible) return;
    if (isPaused()) {
      frame();
      return;
    }
    timer.reset();
    const tick = () => {
      frame();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const onMove = (event: PointerEvent) => {
    const p = project(event);
    if (!p) return;
    mouse.tx = p.x;
    mouse.tz = p.z;
  };
  const onDown = (event: PointerEvent) => {
    const p = project(event);
    if (p) ripple(p.x, p.z);
  };
  const onRipple = () => {
    const near = mouse.x < 50;
    ripple(near ? mouse.x : 4, near ? mouse.z : 0);
  };
  const onMotion = (event: Event) => {
    if ((event as CustomEvent<{ paused: boolean }>).detail?.paused) stop();
    else start();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pansarini:ripple', onRipple);
  window.addEventListener('pansarini:motion', onMotion);

  const resize = new ResizeObserver(() => {
    const width = el.clientWidth;
    const height = el.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 700 ? 55 : 38;
    camera.updateProjectionMatrix();
    if (raf === undefined && visible) frame();
  });
  resize.observe(el);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  intersection.observe(el);
  const firstRipple = window.setTimeout(() => ripple(4, 0), 400);

  return () => {
    stop();
    window.clearTimeout(firstRipple);
    resize.disconnect();
    intersection.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pansarini:ripple', onRipple);
    window.removeEventListener('pansarini:motion', onMotion);
    timer.dispose();
    mesh.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
