/**
 * museum.ts — Immersive Space Gallery
 *
 * A curved glass corridor floating in deep space, inspired by reference:
 *   - Ultra-reflective mirror floor (Reflector) — THE key visual element
 *   - Vivid, bright artwork panels with white neon glowing borders
 *   - Curved obsidian architecture with arched ceiling showing stars
 *   - Earth visible through the corridor end
 *   - Cool blue-white lighting from artwork panels
 *
 * Post-processing: Bloom → FilmGrain → ChromaticAberration → Vignette → FXAA
 */

import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader }      from 'three/addons/shaders/FXAAShader.js';
import gsap from 'gsap';

// ─────────────────────────────────────────────────────────────────────────────
// ARTWORK MANIFEST
// ─────────────────────────────────────────────────────────────────────────────

interface ArtworkMeta {
  id:          string;
  title:       string;
  artist:      string;
  category:    string;
  description: string;
  tags:        string[];
  side:        'left' | 'right';
  dims:        [number, number]; // [width, height] in world units
  colors:      string[];         // 3 vivid colors for procedural fallback
  img:         string;           // Path to real artwork image
}

const MANIFEST: ArtworkMeta[] = [
  // dims = [width, height] matching actual image aspect ratio, scaled to max 5.0 units for proper wall presence
  { id: 'photo-1',  title: 'Capture 01', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [5.00, 3.65], colors: ['#444444'], img: '/images/gallery/img_01.jpg' },  // 1920x1400 landscape
  { id: 'photo-2',  title: 'Capture 02', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [3.75, 5.00], colors: ['#444444'], img: '/images/gallery/img_02.jpg' },  // 1440x1920 portrait
  { id: 'photo-3',  title: 'Capture 03', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [5.00, 3.21], colors: ['#444444'], img: '/images/gallery/img_03.jpg' },  // 1920x1234 landscape
  { id: 'photo-4',  title: 'Capture 04', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [5.00, 3.31], colors: ['#444444'], img: '/images/gallery/img_04.jpg' },  // 1920x1271 landscape
  { id: 'photo-5',  title: 'Capture 05', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [3.59, 5.00], colors: ['#444444'], img: '/images/gallery/img_05.jpg' },  // 1380x1920 portrait
  { id: 'photo-6',  title: 'Capture 06', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [3.99, 5.00], colors: ['#444444'], img: '/images/gallery/img_06.jpg' },  // 1533x1920 portrait
  { id: 'photo-7',  title: 'Capture 07', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [5.00, 3.27], colors: ['#444444'], img: '/images/gallery/img_07.jpg' },  // 1920x1257 landscape
  { id: 'photo-8',  title: 'Capture 08', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [5.00, 3.75], colors: ['#444444'], img: '/images/gallery/img_08.jpg' },  // 1920x1441 landscape
  { id: 'photo-9',  title: 'Capture 09', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [5.00, 3.75], colors: ['#444444'], img: '/images/gallery/img_09.jpg' },  // 1920x1441 landscape
  { id: 'photo-10', title: 'Capture 10', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [5.00, 4.05], colors: ['#444444'], img: '/images/gallery/img_10.jpg' },  // 1920x1557 landscape
  { id: 'photo-11', title: 'Capture 11', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [3.75, 5.00], colors: ['#444444'], img: '/images/gallery/img_11.jpg' },  // 1440x1920 portrait
  { id: 'photo-12', title: 'Capture 12', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [5.00, 3.75], colors: ['#444444'], img: '/images/gallery/img_12.jpg' },  // 1920x1440 landscape
  { id: 'photo-13', title: 'Capture 13', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [5.00, 3.33], colors: ['#444444'], img: '/images/gallery/img_13.jpg' },  // 1920x1280 landscape
  { id: 'photo-14', title: 'Capture 14', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [5.00, 3.33], colors: ['#444444'], img: '/images/gallery/img_14.jpg' },  // 1920x1280 landscape
  { id: 'photo-15', title: 'Capture 15', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'left',  dims: [4.01, 5.00], colors: ['#444444'], img: '/images/gallery/img_15.jpg' },  // 1541x1920 portrait
  { id: 'photo-16', title: 'Capture 16', artist: 'USER', category: 'Photography', description: 'Original capture.', tags: ['Archive'], side: 'right', dims: [5.00, 3.31], colors: ['#444444'], img: '/images/gallery/img_16.jpg' },  // 1920x1271 landscape
];

// ─────────────────────────────────────────────────────────────────────────────
// POST-PROCESSING SHADERS (unchanged — these work well)
// ─────────────────────────────────────────────────────────────────────────────

const FilmGrainShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0.0 }, intensity: { value: 0.018 } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float time;uniform float intensity;varying vec2 vUv;
    float rand(vec2 co){return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453);}
    void main(){vec4 c=texture2D(tDiffuse,vUv);float g=rand(vUv+fract(time))*intensity;c.rgb+=g-intensity*0.5;gl_FragColor=c;}`,
};

const ChromaShader = {
  uniforms: { tDiffuse: { value: null }, intensity: { value: 0.006 } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float intensity;varying vec2 vUv;
    void main(){vec2 d=vUv-0.5;float r2=dot(d,d);float ab=r2*intensity;
    float red=texture2D(tDiffuse,vUv+d*ab*1.6).r;float green=texture2D(tDiffuse,vUv).g;float blue=texture2D(tDiffuse,vUv-d*ab).b;
    gl_FragColor=vec4(red,green,blue,1.);}`,
};

const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, intensity: { value: 0.15 } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float intensity;varying vec2 vUv;
    void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 u=vUv*(1.-vUv.yx);float v=pow(u.x*u.y*25.,intensity);gl_FragColor=vec4(c.rgb*v,c.a);}`,
};


// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function initMuseum(): { dispose: () => void } | void {
  const canvas        = document.getElementById('museum-canvas') as HTMLCanvasElement;
  const museumSection = document.getElementById('act-museum')    as HTMLElement;
  const overlay       = document.getElementById('museum-overlay') as HTMLElement;
  if (!canvas || !museumSection) { console.error('Museum: missing DOM elements'); return; }

  // ─── Scroll measurement ───
  let HERO_PX  = 0;
  let MUSEUM_PX = 0;
  function measure() {
    const heroEl = document.getElementById('act-hero');
    HERO_PX   = heroEl ? heroEl.offsetHeight : window.innerHeight * 5;
    const musEl = document.getElementById('act-museum');
    MUSEUM_PX = musEl ? musEl.offsetHeight : window.innerHeight * 4.2;
  }
  measure();

  // ─────────────────────────────────────────────────────────────────────────
  // THREE.JS CORE
  // ─────────────────────────────────────────────────────────────────────────

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: false, powerPreference: 'high-performance',
  });
  renderer.setSize(W(), H());
  // Cap pixel ratio — 1.5 balances retina sharpness vs GPU load
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  // Disable shadows. In a scene with ~50 lights and a mirror, shadows = lag
  renderer.shadowMap.enabled = false;
  renderer.toneMapping       = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace  = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a10);  // Deep space black
  scene.fog = new THREE.FogExp2(0x0a0a10, 0.004);

  const camera = new THREE.PerspectiveCamera(65, W() / H(), 0.1, 500);

  // ─────────────────────────────────────────────────────────────────────────
  // CAMERA PATH — Gentle curve through the gallery corridor
  // ─────────────────────────────────────────────────────────────────────────

  const CAMERA_Y = 2.8; // Eye height — raised for better view of panels
  const PATH_PTS = [
    // ── ENTRANCE ──
    new THREE.Vector3(  0,    CAMERA_Y,    2  ),
    // ── TURN 1: Curve LEFT ──
    new THREE.Vector3( -3,    CAMERA_Y,  -10  ),
    new THREE.Vector3( -6,    CAMERA_Y,  -20  ),
    // ── TURN 2: Curve RIGHT ──
    new THREE.Vector3( -3,    CAMERA_Y,  -30  ),
    new THREE.Vector3(  4,    CAMERA_Y,  -38  ),
    new THREE.Vector3(  6,    CAMERA_Y,  -46  ),
    // ── TURN 3: Curve LEFT toward exit ──
    new THREE.Vector3(  2,    CAMERA_Y,  -54  ),
    new THREE.Vector3(  0,    CAMERA_Y,  -62  ),
    new THREE.Vector3( -2,    CAMERA_Y,  -69  ),
    new THREE.Vector3( -4,    CAMERA_Y,  -76  ),
  ];
  const spline = new THREE.CatmullRomCurve3(PATH_PTS, false, 'catmullrom', 0.5);

  // Artwork positions: 16 panels explicitly and perfectly spaced across the 99 available spans.
  const PANEL_T = [3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93].map(i => (i + 0.5) / 99);

  // ─────────────────────────────────────────────────────────────────────────
  // CORRIDOR CONSTANTS
  // ─────────────────────────────────────────────────────────────────────────

  const CORRIDOR_HALF_W = 5.5;   // Half-width  (closer walls = more immersive)
  const WALL_HEIGHT     = 8.0;
  const WALL_THICKNESS  = 0.18;
  const WALL_SEGMENT_L  = 4.78;
  const NUM_WALL_SEGS   = 100;
  const NUM_CEILING_ARCS = 50;

  // ─────────────────────────────────────────────────────────────────────────
  // PHYSICS CAMERA STATE
  // ─────────────────────────────────────────────────────────────────────────

  let curT     = 0;
  let targetT  = 0;
  let velocity = 0;
  // Camera scroll — simple smooth lerp, no spring physics
  const LERP_SPEED = 0.08;  // How fast camera catches up to scroll position

  // Simple parallax mouse look — just gently shifts where you're looking
  let mouseNX = 0, mouseNY = 0;
  let smoothMX = 0, smoothMY = 0;  // Smoothed mouse position

  const startTime = performance.now();

  let isFocused    = false;
  let focusedMesh: THREE.Mesh | null = null;
  let focusCamTarget: THREE.Vector3 | null = null;  // Where camera looks during focus

  const artworkMeshes: THREE.Mesh[]       = [];
  const artworkLights: THREE.PointLight[]  = [];
  const artworkData = new Map<THREE.Mesh, ArtworkMeta>();
  const reflectorHidden: THREE.Object3D[]  = []; // Meshes hidden from floor reflections

  // Dust system
  const DUST_N     = 200;
  const dustBase   : THREE.Vector3[] = [];
  const dustPhase  : number[]        = [];
  let   dustMesh   : THREE.InstancedMesh;
  const _d         = new THREE.Object3D();

  const raycaster = new THREE.Raycaster();
  const mouse2D   = new THREE.Vector2(9999, 9999);
  const sharedLoader = new THREE.TextureLoader();

  // Removed bloomPass to retain pure original photo colors
  let composer  : EffectComposer;

  // FPS tracking
  let frameCount = 0, lastFpsT = performance.now(), curFps = 60;

  // ─────────────────────────────────────────────────────────────────────────
  // MATERIALS — Reused across architecture
  // ─────────────────────────────────────────────────────────────────────────

  // Dramatic deep ceiling with steel-blue tint
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x484858, metalness: 0.70, roughness: 0.15,
    transparent: true, opacity: 0.75, side: THREE.DoubleSide,
    emissive: new THREE.Color(0x1a1a2a), emissiveIntensity: 0.6,
  });

  const ribMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a35, metalness: 0.82, roughness: 0.12,
    emissive: new THREE.Color(0x080818), emissiveIntensity: 0.3,
  });

  // ═════════════════════════════════════════════════════════════════════════
  // BUILD WORLD — Execute all builders
  // ═════════════════════════════════════════════════════════════════════════

  // buildStarfield();  — REMOVED: No space elements
  // nebula skybox    — REMOVED: No space elements  
  // buildEarth();    — REMOVED: No space elements
  buildCorridorWalls();
  buildCeilingArches();
  buildStructuralRibs();
  buildReflectiveFloor();
  buildGlassRailings();
  buildDust();

  MANIFEST.forEach((meta, i) => {
    const t  = PANEL_T[Math.min(i, PANEL_T.length - 1)];
    const pt = spline.getPointAt(t);
    buildArtworkPanel(meta, pt, t, i);
  });

  buildAmbientLighting();
  composer = buildPostProcessing();

  // ═════════════════════════════════════════════════════════════════════════
  // 1. STARFIELD — 6000 stars scattered on a large sphere
  // ═════════════════════════════════════════════════════════════════════════

  function buildStarfield() {
    const N = 6000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 120 + Math.random() * 180;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      // Cool white-blue stars
      const b = 0.5 + Math.random() * 0.5;
      col[i*3]   = b * 0.85;
      col[i*3+1] = b * 0.90;
      col[i*3+2] = b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.18, vertexColors: true, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    })));
  }



  // ═════════════════════════════════════════════════════════════════════════
  // 2. EARTH — Visible through the far end of the corridor
  // ═════════════════════════════════════════════════════════════════════════

  function buildEarth() {
    const earthGeo = new THREE.SphereGeometry(40, 64, 64);

    // Procedural Earth texture
    const CW = 1024, CH = 512;
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const ctx = c.getContext('2d')!;

    // Deep blue oceans
    ctx.fillStyle = '#0a1a3e';
    ctx.fillRect(0, 0, CW, CH);

    // Land masses (simplified continents with noise)
    ctx.fillStyle = '#1a3a25';
    for (let i = 0; i < 35; i++) {
      const x = Math.random() * CW;
      const y = CW * 0.15 + Math.random() * CH * 0.7;
      const rx = 30 + Math.random() * 120;
      const ry = 20 + Math.random() * 80;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cloud wisps
    ctx.fillStyle = 'rgba(200, 220, 255, 0.15)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * CW;
      const y = Math.random() * CH;
      const rx = 20 + Math.random() * 100;
      const ry = 5 + Math.random() * 25;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Atmosphere edge glow
    const atmoGrad = ctx.createLinearGradient(0, 0, 0, CH);
    atmoGrad.addColorStop(0, 'rgba(100, 180, 255, 0.25)');
    atmoGrad.addColorStop(0.15, 'transparent');
    atmoGrad.addColorStop(0.85, 'transparent');
    atmoGrad.addColorStop(1, 'rgba(100, 180, 255, 0.25)');
    ctx.fillStyle = atmoGrad;
    ctx.fillRect(0, 0, CW, CH);

    const earthTex = new THREE.CanvasTexture(c);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      emissive: new THREE.Color(0x1a3060),
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.8,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    // Position Earth visible through the far end of corridor
    earth.position.set(8, 15, -120);
    scene.add(earth);

    // Atmosphere halo (additive blending sphere slightly larger)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(42, 32, 32), haloMat);
    halo.position.copy(earth.position);
    scene.add(halo);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. CORRIDOR WALLS — Segments placed along the camera spline
  // ═════════════════════════════════════════════════════════════════════════

  function buildCorridorWalls() {
    // ── Materials ──────────────────────────────────────────────────────────
    // Premium gallery wall — pure minimalist museum white (matte finish)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa, metalness: 0.02, roughness: 0.95, side: THREE.DoubleSide,
      emissive: new THREE.Color(0x0a0a0c), emissiveIntensity: 0.15,
    });
    // Chrome-like trim strips
    const trimMat2 = new THREE.MeshStandardMaterial({
      color: 0xf8f8fa, metalness: 0.35, roughness: 0.20, side: THREE.DoubleSide,
      emissive: new THREE.Color(0x181820), emissiveIntensity: 0.05,
    });
    // Cool silver accent bands
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xd0d0d8, metalness: 0.12, roughness: 0.55, side: THREE.DoubleSide,
    });
    // Rich gold sconce brackets
    const sconceFxMat = new THREE.MeshStandardMaterial({
      color: 0xc8a860, metalness: 0.85, roughness: 0.15,
      emissive: new THREE.Color(0x2a1e08), emissiveIntensity: 0.3,
    });

    // ── Architectural heights ─────────────────────────────────────────────
    const DADO_H    = 1.0;
    const MID_H     = 4.2;
    const CORNICE_H = WALL_HEIGHT - 0.25;

    const SUBDIV = 100; // Smooth curve subdivision
    const WALL_THICK = 0.20;

    // ══════════════════════════════════════════════════════════════════════
    // HELPER: Build a continuous strip mesh following the spline curve.
    // This creates a single unbroken mesh — ZERO gaps by construction.
    // height = strip height, yBottom = Y position of strip bottom,
    // thickness = how far it protrudes from the wall face inward.
    // ══════════════════════════════════════════════════════════════════════
    function buildContinuousStrip(
      side: number, height: number, yBottom: number, 
      thickness: number, mat: THREE.Material, extraInward = 0
    ) {
      const pos: number[] = [];
      const nrm: number[] = [];
      const uvs: number[] = [];
      const idx: number[] = [];

      for (let i = 0; i <= SUBDIV; i++) {
        const t = i / SUBDIV;
        const pt = spline.getPointAt(t);
        const tan = spline.getTangentAt(t);
        const nx = tan.z, nz = -tan.x;
        const len = Math.sqrt(nx * nx + nz * nz);
        const nnx = nx / len, nnz = nz / len;

        // Inward direction (toward corridor center)
        const inX = -side * nnx;
        const inZ = -side * nnz;

        // Wall boundary position
        const bx = pt.x + nnx * CORRIDOR_HALF_W * side;
        const bz = pt.z + nnz * CORRIDOR_HALF_W * side;

        // Front face (inner corridor side) pushed inward by extraInward
        const fx = bx + inX * extraInward;
        const fz = bz + inZ * extraInward;
        // Back face pushed further by thickness
        const rx = fx + inX * thickness;
        const rz = fz + inZ * thickness;

        const u = t;

        // 4 verts per slice: back-bottom, back-top, front-bottom, front-top
        pos.push(fx, yBottom, fz);             // 0: front-bottom
        nrm.push(inX, 0, inZ);
        uvs.push(u, 0);

        pos.push(fx, yBottom + height, fz);    // 1: front-top
        nrm.push(inX, 0, inZ);
        uvs.push(u, 1);

        pos.push(rx, yBottom, rz);             // 2: back-bottom
        nrm.push(-inX, 0, -inZ);
        uvs.push(u, 0);

        pos.push(rx, yBottom + height, rz);    // 3: back-top
        nrm.push(-inX, 0, -inZ);
        uvs.push(u, 1);

        if (i > 0) {
          const p = (i - 1) * 4, c = i * 4;
          // Front face (visible from inside corridor)
          idx.push(p, c, p + 1);  idx.push(p + 1, c, c + 1);
          // Back face
          idx.push(c + 2, p + 2, p + 3);  idx.push(c + 2, p + 3, c + 3);
        }
      }

      // Top and bottom caps
      for (let i = 0; i < SUBDIV; i++) {
        const p = i * 4, c = (i + 1) * 4;
        // Top cap
        idx.push(p + 1, c + 1, c + 3);  idx.push(p + 1, c + 3, p + 3);
        // Bottom cap
        idx.push(c, p, p + 2);  idx.push(c, p + 2, c + 2);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals(); // Smooth normals for better lighting

      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    }

    // ══════════════════════════════════════════════════════════════════════
    // BUILD THE WALLS
    // ══════════════════════════════════════════════════════════════════════

    for (let side = -1; side <= 1; side += 2) {
      // ── 1. MAIN WALL SLAB — monolithic clean surface ────────
      buildContinuousStrip(side, WALL_HEIGHT, 0, WALL_THICK, wallMat);

      // ── 2. FLOOR REVEAL (Shadow Gap) — modern floating wall effect ──
      // Cuts a deep dark gap at the very bottom of the wall.
      buildContinuousStrip(side, 0.15, 0.075, 0.01, 
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1.0, side: THREE.DoubleSide }),
        WALL_THICK + 0.001
      );

      // ── 3. LED TRACK LIGHTING — glowing strip inside the shadow gap ──
      // High-intensity emissive material for perfect floor-level bloom
      const ledMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 });
      buildContinuousStrip(side, 0.01, 0.04, 0.05, ledMat, WALL_THICK + 0.001);

      // ── 4. CEILING REVEAL — sleek architectural cut near the top ────────
      buildContinuousStrip(side, 0.10, WALL_HEIGHT - 0.15, 0.05, 
        new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.9, side: THREE.DoubleSide }),
        WALL_THICK + 0.001
      );

      // ── 5. HORIZONTAL ALCOVE RAIL — a subtle recessed dark steel line ───
      buildContinuousStrip(side, 0.02, 1.20, 0.04, 
        new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8, roughness: 0.2, side: THREE.DoubleSide }),
        WALL_THICK + 0.001
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // PREMIUM MODERN ARCHITECTURAL FIXTURES (Precision Aligned)
    // ══════════════════════════════════════════════════════════════════════
    
    // Sleek dark brushed steel for structural fins and backdrop plates
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8, roughness: 0.3 });
    const shadowGapMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0 });
    // Tripled intensity for stunning sci-fi bloom
    const neonBladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.5 });

    const numPanels = NUM_WALL_SEGS - 1; // 79 panels
    const panelLen = spline.getLength() / numPanels;

    // Perfectly fits between the Baseboard reveal (0.15) and Ceiling reveal (7.85)
    const FIXTURE_H = 7.7; 
    const FIXTURE_Y = 0.15 + (FIXTURE_H / 2); // 4.0

    // Build a set of artwork panel segment indices so fixtures don't overlap photos
    const artworkSegIndices = new Set<number>();
    const panelSegments = [3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93];
    for (const seg of panelSegments) {
      // Mark the panel segment and its immediate neighbors as off-limits for fixtures
      artworkSegIndices.add(seg - 1);
      artworkSegIndices.add(seg);
      artworkSegIndices.add(seg + 1);
    }

    for (let i = 0; i < numPanels; i++) {
      const tMid = (i + 0.5) / numPanels;
      const pt = spline.getPointAt(tMid);
      const tan = spline.getTangentAt(tMid);
      const angle = Math.atan2(tan.x, tan.z);
      const nx = tan.z, nz = -tan.x;
      const nLen = Math.sqrt(nx * nx + nz * nz);
      const nnx = nx / nLen, nnz = nz / nLen;

      // Skip fixtures near artwork positions
      if (artworkSegIndices.has(i)) continue;

      for (let side = -1; side <= 1; side += 2) {
        const inX = -side * nnx;
        const inZ = -side * nnz;
        // Subtly protrude just past the wall thickness to be visible
        const wx = pt.x + nnx * CORRIDOR_HALF_W * side + inX * (WALL_THICK + 0.002);
        const wz = pt.z + nnz * CORRIDOR_HALF_W * side + inZ * (WALL_THICK + 0.002);

        const g = new THREE.Group();
        g.position.set(wx, 0, wz);
        // Tangent rotation correctly faces inward
        g.rotation.y = side === 1 ? angle + Math.PI : angle;
        scene.add(g);

        // Substantially reduced 'lining': Only place a shadow gap every 4th segment 
        // to form massive, cleaner interconnected wall slabs.
        if (i % 4 === 0) {
          const gap = new THREE.Mesh(new THREE.BoxGeometry(0.04, FIXTURE_H, 0.015), shadowGapMat);
          gap.position.set(0.0, FIXTURE_Y, panelLen / 2);
          g.add(gap);
        }

        // Every 6th panel natively falls exactly centrally between artworks, house the neon blade
        if (i % 6 === 0) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, FIXTURE_H, 0.012), neonBladeMat);
          blade.position.set(0.01, FIXTURE_Y, panelLen / 2);
          g.add(blade);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // SCONCES — Placed at regular intervals along each wall
    // ══════════════════════════════════════════════════════════════════════

    // Pre-allocate shared sconce geometries & materials
    const mountGeo   = new THREE.BoxGeometry(0.02, 0.30, 0.08);
    const armGeo     = new THREE.BoxGeometry(0.10, 0.015, 0.015);
    const armVGeo    = new THREE.BoxGeometry(0.015, 0.08, 0.015);
    const socketGeo  = new THREE.CylinderGeometry(0.035, 0.02, 0.03, 8);
    const bulbGeo    = new THREE.SphereGeometry(0.12, 12, 12);
    const bulbMat    = new THREE.MeshBasicMaterial({ color: 0xfff0c0 });
    const haloGeo    = new THREE.SphereGeometry(0.25, 12, 12);
    const haloMat    = new THREE.MeshBasicMaterial({
      color: 0xffe8a0, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    // Build a set of artwork T-values so sconces don't overlap photos
    const artworkTValues = PANEL_T;

    const SCONCE_COUNT = 7;
    for (let i = 0; i < SCONCE_COUNT; i++) {
      const t = (i + 0.5) / SCONCE_COUNT;

      // Skip if this sconce is too close to an artwork panel
      const tooClose = artworkTValues.some(at => Math.abs(at - t) < 0.04);
      if (tooClose) continue;

      const pt = spline.getPointAt(t);
      const tan = spline.getTangentAt(t);
      const angle = Math.atan2(tan.x, tan.z);
      const nx = tan.z, nz = -tan.x;
      const len = Math.sqrt(nx * nx + nz * nz);
      const nnx = nx / len, nnz = nz / len;

      for (let side = -1; side <= 1; side += 2) {
        const inX = -side * nnx;
        const inZ = -side * nnz;
        const wx = pt.x + nnx * CORRIDOR_HALF_W * side + inX * (WALL_THICK + 0.01);
        const wz = pt.z + nnz * CORRIDOR_HALF_W * side + inZ * (WALL_THICK + 0.01);

        const sconceGroup = new THREE.Group();
        sconceGroup.position.set(wx, 0, wz);
        sconceGroup.rotation.y = side === 1 ? angle + Math.PI : angle;
        scene.add(sconceGroup);

        const SY = 3.8, SX = 0.0;

        const mount = new THREE.Mesh(mountGeo, sconceFxMat);
        mount.position.set(SX, SY, 0);
        sconceGroup.add(mount);

        const arm = new THREE.Mesh(armGeo, sconceFxMat);
        arm.position.set(SX + 0.06, SY - 0.08, 0);
        sconceGroup.add(arm);

        const armV = new THREE.Mesh(armVGeo, sconceFxMat);
        armV.position.set(SX + 0.11, SY - 0.04, 0);
        sconceGroup.add(armV);

        const socket = new THREE.Mesh(socketGeo, sconceFxMat);
        socket.position.set(SX + 0.11, SY, 0);
        sconceGroup.add(socket);

        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(SX + 0.11, SY + 0.06, 0);
        sconceGroup.add(bulb);
        reflectorHidden.push(bulb);

        // Warm glow halo around bulb
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(SX + 0.11, SY + 0.06, 0);
        sconceGroup.add(halo);
        reflectorHidden.push(halo);

        // Warm point light — only every other sconce to limit total lights
        if (i % 2 === 0) {
          const light = new THREE.PointLight(0xffecc0, 2.5, 12, 2);
          light.position.set(SX + 0.15, SY + 0.06, 0);
          sconceGroup.add(light);
          reflectorHidden.push(light);
        }
      }
    }
  }



  // ═════════════════════════════════════════════════════════════════════════
  // 4. CEILING ARCHES — Partial cylinders creating the vaulted ceiling
  // ═════════════════════════════════════════════════════════════════════════

  function buildCeilingArches() {
    // ── MAIN CEILING SURFACE — continuous mesh following the curve ──
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x808088, metalness: 0.8, roughness: 0.18,
      emissive: new THREE.Color(0x505058), emissiveIntensity: 0.8,
      side: THREE.DoubleSide,
    });

    // Build ceiling as continuous quad strip spanning left-wall to right-wall
    const CEIL_SUB = 100;
    const ceilPos: number[] = [];
    const ceilNrm: number[] = [];
    const ceilIdx: number[] = [];

    for (let i = 0; i <= CEIL_SUB; i++) {
      const t = i / CEIL_SUB;
      const pt = spline.getPointAt(t);
      const tan = spline.getTangentAt(t);
      const nx = tan.z, nz = -tan.x;
      const len = Math.sqrt(nx * nx + nz * nz);
      const nnx = nx / len, nnz = nz / len;

      // Left edge
      const lx = pt.x - nnx * CORRIDOR_HALF_W * 1.05;
      const lz = pt.z - nnz * CORRIDOR_HALF_W * 1.05;
      // Right edge
      const rx = pt.x + nnx * CORRIDOR_HALF_W * 1.05;
      const rz = pt.z + nnz * CORRIDOR_HALF_W * 1.05;

      const ceilY = WALL_HEIGHT + 0.2;

      // Vertex 0: left, Vertex 1: right
      ceilPos.push(lx, ceilY, lz);
      ceilNrm.push(0, -1, 0);
      ceilPos.push(rx, ceilY, rz);
      ceilNrm.push(0, -1, 0);

      if (i > 0) {
        const p = (i - 1) * 2, c = i * 2;
        ceilIdx.push(p, c, p + 1);
        ceilIdx.push(p + 1, c, c + 1);
      }
    }

    const ceilGeo = new THREE.BufferGeometry();
    ceilGeo.setAttribute('position', new THREE.Float32BufferAttribute(ceilPos, 3));
    ceilGeo.setAttribute('normal', new THREE.Float32BufferAttribute(ceilNrm, 3));
    ceilGeo.setIndex(ceilIdx);
    scene.add(new THREE.Mesh(ceilGeo, ceilMat));

    // ── CEILING-WALL TRIM — continuous strips following the curve ──
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x8a8a92, metalness: 0.85, roughness: 0.1,
      emissive: new THREE.Color(0x4a4a52), emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
    });
    const accentBasicMat = new THREE.MeshBasicMaterial({
      color: 0x2244bb, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
    });

    // Build trim and accent as continuous strips at ceiling-wall junction
    for (let side = -1; side <= 1; side += 2) {
      // Trim strip
      const tPos: number[] = [], tNrm: number[] = [], tIdx: number[] = [];
      // Accent strip
      const aPos: number[] = [], aNrm: number[] = [], aIdx: number[] = [];

      for (let i = 0; i <= CEIL_SUB; i++) {
        const t = i / CEIL_SUB;
        const pt = spline.getPointAt(t);
        const tan = spline.getTangentAt(t);
        const nx = tan.z, nz = -tan.x;
        const l = Math.sqrt(nx * nx + nz * nz);
        const nnx = nx / l, nnz = nz / l;

        const wx = pt.x + nnx * CORRIDOR_HALF_W * side;
        const wz = pt.z + nnz * CORRIDOR_HALF_W * side;
        const inX = -side * nnx, inZ = -side * nnz;

        // Trim: 0.15 wide, 0.3 tall at ceiling
        tPos.push(wx, WALL_HEIGHT + 0.2, wz);
        tNrm.push(inX, 0, inZ);
        tPos.push(wx, WALL_HEIGHT - 0.1, wz);
        tNrm.push(inX, 0, inZ);

        // Accent: at wall height - 0.15
        aPos.push(wx + inX * 0.01, WALL_HEIGHT - 0.13, wz + inZ * 0.01);
        aNrm.push(inX, 0, inZ);
        aPos.push(wx + inX * 0.01, WALL_HEIGHT - 0.17, wz + inZ * 0.01);
        aNrm.push(inX, 0, inZ);

        if (i > 0) {
          const p = (i - 1) * 2, c = i * 2;
          tIdx.push(p, c, p + 1); tIdx.push(p + 1, c, c + 1);
          aIdx.push(p, c, p + 1); aIdx.push(p + 1, c, c + 1);
        }
      }

      const tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3));
      tGeo.setAttribute('normal', new THREE.Float32BufferAttribute(tNrm, 3));
      tGeo.setIndex(tIdx);
      scene.add(new THREE.Mesh(tGeo, trimMat));

      const aGeo = new THREE.BufferGeometry();
      aGeo.setAttribute('position', new THREE.Float32BufferAttribute(aPos, 3));
      aGeo.setAttribute('normal', new THREE.Float32BufferAttribute(aNrm, 3));
      aGeo.setIndex(aIdx);
      scene.add(new THREE.Mesh(aGeo, accentBasicMat));
    }

    // ── CROSS BEAMS + TUBE LIGHTS + SUPPORT PILLARS ──
    // Pre-allocate shared materials (avoids creating ~150 materials in the loop)
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x505060, metalness: 0.88, roughness: 0.10,
      emissive: new THREE.Color(0x2a2a35), emissiveIntensity: 0.7,
    });
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a68, metalness: 0.90, roughness: 0.08,
      emissive: new THREE.Color(0x252530), emissiveIntensity: 0.65,
    });
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xeef4ff, transparent: true, opacity: 0.95,
    });
    const pillarMat2 = new THREE.MeshStandardMaterial({
      color: 0x454550, metalness: 0.82, roughness: 0.12,
      emissive: new THREE.Color(0x1a1a22), emissiveIntensity: 0.55,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x505060, metalness: 0.80, roughness: 0.14,
      emissive: new THREE.Color(0x181822), emissiveIntensity: 0.4,
    });
    const accentLightMat = new THREE.MeshBasicMaterial({
      color: 0x4466dd, transparent: true, opacity: 0.7,
    });
    // Shared geometries for repeated elements
    const pillarGeo = new THREE.BoxGeometry(0.18, WALL_HEIGHT, 0.18);
    const baseCapGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
    const topCapGeo = new THREE.BoxGeometry(0.28, 0.12, 0.28);
    const accentGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const tubeGeo = new THREE.CylinderGeometry(0.10, 0.10, CORRIDOR_HALF_W * 1.3, 12);
    const housingGeo = new THREE.BoxGeometry(CORRIDOR_HALF_W * 1.5, 0.08, 0.35);
    const beamGeo = new THREE.BoxGeometry(CORRIDOR_HALF_W * 2 + 0.3, 0.3, 0.25);

    for (let i = 0; i < NUM_CEILING_ARCS; i++) {
      const t = (i + 0.5) / NUM_CEILING_ARCS;
      const center = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();
      // Perpendicular normal in XZ plane (points from center to right wall)
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      // Main cross-beam — spans between walls, rotated to match curve
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(center.x, WALL_HEIGHT, center.z);
      beam.rotation.y = angle;
      scene.add(beam);

      // Recessed ceiling panel between this beam and the next
      if (i < NUM_CEILING_ARCS - 1) {
        const nextT = ((i + 1) + 0.5) / NUM_CEILING_ARCS;
        const nextCenter = spline.getPointAt(nextT);
        const midX = (center.x + nextCenter.x) / 2;
        const midZ = (center.z + nextCenter.z) / 2;
        const dx = nextCenter.x - center.x;
        const dz = nextCenter.z - center.z;
        const panelLen = Math.sqrt(dx * dx + dz * dz) * 0.7;
        const midAngle = Math.atan2(dx, dz);

        const ceilPanel = new THREE.Mesh(
          new THREE.PlaneGeometry(CORRIDOR_HALF_W * 1.4, panelLen),
          beamMat // Reuse beam material for ceiling panels
        );
        ceilPanel.position.set(midX, WALL_HEIGHT - 0.02, midZ);
        ceilPanel.rotation.set(Math.PI / 2, 0, -midAngle);
        scene.add(ceilPanel);
      }

      // TUBE LIGHT
      {
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.set(center.x, WALL_HEIGHT - 0.15, center.z);
        housing.rotation.y = angle;
        scene.add(housing);

        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        tube.position.set(center.x, WALL_HEIGHT - 0.25, center.z);
        tube.rotation.set(0, angle, Math.PI / 2);
        scene.add(tube);
        reflectorHidden.push(tube);

        // Point light — only every other beam to reduce light count
        if (i % 2 === 0) {
          const tubeLight = new THREE.PointLight(0xdde8ff, 1.8, 10, 2.0);
          tubeLight.position.set(center.x, WALL_HEIGHT - 0.4, center.z);
          scene.add(tubeLight);
          reflectorHidden.push(tubeLight);
        }
      }

      // VERTICAL SUPPORT PILLARS
      for (let side = -1; side <= 1; side += 2) {
        const px = center.x + normal.x * CORRIDOR_HALF_W * side;
        const pz = center.z + normal.z * CORRIDOR_HALF_W * side;

        const pillar = new THREE.Mesh(pillarGeo, pillarMat2);
        pillar.position.set(px, WALL_HEIGHT / 2, pz);
        pillar.rotation.y = angle;
        scene.add(pillar);

        const baseCap = new THREE.Mesh(baseCapGeo, capMat);
        baseCap.position.set(px, 0.08, pz);
        baseCap.rotation.y = angle;
        scene.add(baseCap);

        const topCap = new THREE.Mesh(topCapGeo, capMat);
        topCap.position.set(px, WALL_HEIGHT - 0.06, pz);
        topCap.rotation.y = angle;
        scene.add(topCap);

        // Floor-level accent light
        if (i % 3 === 0) {
          const baseLight = new THREE.Mesh(accentGeo, accentLightMat);
          const inX = -side * normal.x;
          const inZ = -side * normal.z;
          baseLight.position.set(px + inX * 0.2, 0.03, pz + inZ * 0.2);
          scene.add(baseLight);
          reflectorHidden.push(baseLight);
        }
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. STRUCTURAL RIBS — Thin arch frames over the corridor
  // ═════════════════════════════════════════════════════════════════════════

  function buildStructuralRibs() {
    const ribCount = 12;
    for (let i = 0; i < ribCount; i++) {
      const t       = (i + 0.5) / ribCount;
      const center  = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t);
      const angle   = Math.atan2(tangent.x, tangent.z);

      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(CORRIDOR_HALF_W, 0.08, 6, 24, Math.PI),
        ribMat
      );
      rib.position.set(center.x, WALL_HEIGHT, center.z);
      rib.rotation.set(0, angle + Math.PI / 2, 0);
      scene.add(rib);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. REFLECTIVE FLOOR — Reflector creates real-time mirror reflections
  //    THIS IS THE #1 VISUAL ELEMENT from the reference image
  // ═════════════════════════════════════════════════════════════════════════

  function buildReflectiveFloor() {
    // ── PRIMARY REFLECTOR — mirror surface ──
    // Width: 30 covers ±7 winding turns + ±5.5 corridor width + margin
    const floorGeo = new THREE.PlaneGeometry(24, 100);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,     // Pure white
      roughness: 0.05,     // Very shiny/glossy
      metalness: 0.1,      // Slight metallic polish
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.01, -30);
    scene.add(floor);

    // ── CURVE-FOLLOWING FLOOR DETAILS ──────────────────────────────────────
    // All floor elements follow the spline curve — no straight lines!

    const FLOOR_SUB = 100;

    // Helper: build a continuous floor-level strip along the curve
    function buildFloorStrip(
      offset: number, // perpendicular offset from center (-1 to 1 * CORRIDOR_HALF_W)
      width: number,
      height: number,
      yPos: number,
      mat: THREE.Material
    ) {
      const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
      for (let i = 0; i <= FLOOR_SUB; i++) {
        const t = i / FLOOR_SUB;
        const pt = spline.getPointAt(t);
        const tan = spline.getTangentAt(t);
        const nx = tan.z, nz = -tan.x;
        const len = Math.sqrt(nx * nx + nz * nz);
        const nnx = nx / len, nnz = nz / len;

        const cx = pt.x + nnx * offset;
        const cz = pt.z + nnz * offset;

        // Left edge of strip
        pos.push(cx - nnx * width / 2, yPos, cz - nnz * width / 2);
        nrm.push(0, 1, 0);
        // Right edge of strip
        pos.push(cx + nnx * width / 2, yPos + height, cz + nnz * width / 2);
        nrm.push(0, 1, 0);

        if (i > 0) {
          const p = (i - 1) * 2, c = i * 2;
          idx.push(p, c, p + 1);
          idx.push(p + 1, c, c + 1);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      geo.setIndex(idx);
      scene.add(new THREE.Mesh(geo, mat));
    }

    // Solid floor trim strips (No more glow/transparency)
    const edgeTrimMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd, metalness: 0.1, roughness: 0.8,
    });
    const floorTrimMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0, metalness: 0.1, roughness: 0.8,
    });
    const accentTrimMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, metalness: 0.2, roughness: 0.5,
    });

    for (let side = -1; side <= 1; side += 2) {
      const sideOffset = side * CORRIDOR_HALF_W;

      // ── Outer edge border ──
      buildFloorStrip(sideOffset * 0.95, 0.05, 0.005, 0.006, edgeTrimMat);

      // ── Floor-to-wall baseboard ──
      buildFloorStrip(sideOffset, 0.12, 0.20, 0.005, floorTrimMat);

      // ── Baseboard accent line ──
      buildFloorStrip(sideOffset, 0.03, 0.005, 0.21, accentTrimMat);
    }

    // ── TILE GROUT LINES (Large solid square tiles) ──
    const groutMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd, metalness: 0.0, roughness: 0.9,
    });
    
    // Longitudinal tile lines (wider lanes for bigger tiles)
    const tileOffsets = [-0.6, -0.2, 0.2, 0.6];
    for (const offsetPct of tileOffsets) {
      buildFloorStrip(CORRIDOR_HALF_W * offsetPct, 0.04, 0.003, 0.004, groutMat);
    }

    // Latitudinal tile lines (reduced count to make them square)
    const jointCount = 30; // Matches the physical dimensions to form large squares
    for (let i = 0; i < jointCount; i++) {
      const t = (i + 0.5) / jointCount;
      const pt = spline.getPointAt(t);
      const tan = spline.getTangentAt(t);
      const angle = Math.atan2(tan.x, tan.z);

      const joint = new THREE.Mesh(
        new THREE.BoxGeometry(CORRIDOR_HALF_W * 1.9, 0.008, 0.025), groutMat
      );
      joint.position.set(pt.x, 0.004, pt.z);
      joint.rotation.y = angle;
      scene.add(joint);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. GLASS RAILINGS — Thin curved transparent barriers
  // ═════════════════════════════════════════════════════════════════════════

  function buildGlassRailings() {
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x8899cc, metalness: 0.9, roughness: 0.05,
      transparent: true, opacity: 0.15,
    });
    const railHeight = 1.0;
    const railOffset = CORRIDOR_HALF_W - 1.5;

    for (let side = -1; side <= 1; side += 2) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const p = spline.getPointAt(t);
        const tan = spline.getTangentAt(t);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        pts.push(new THREE.Vector3(
          p.x + norm.x * railOffset * side,
          railHeight * 0.5,
          p.z + norm.z * railOffset * side
        ));
      }
      const railCurve = new THREE.CatmullRomCurve3(pts);
      const railGeo   = new THREE.TubeGeometry(railCurve, 80, 0.03, 6, false);
      scene.add(new THREE.Mesh(railGeo, railMat));

      // Glass panel below railing
      const panelPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const p = spline.getPointAt(t);
        const tan = spline.getTangentAt(t);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        panelPts.push(new THREE.Vector3(
          p.x + norm.x * railOffset * side,
          0.01,
          p.z + norm.z * railOffset * side
        ));
      }
      // Create a thin vertical plane along each railing point
      for (let i = 0; i < panelPts.length - 1; i += 3) {
        const p1 = panelPts[i];
        const p2 = panelPts[Math.min(i + 3, panelPts.length - 1)];
        const seg = new THREE.Mesh(
          new THREE.PlaneGeometry(p1.distanceTo(p2), railHeight),
          new THREE.MeshStandardMaterial({
            color: 0xaabbdd, metalness: 0.8, roughness: 0.05,
            transparent: true, opacity: 0.06, side: THREE.DoubleSide,
          })
        );
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        seg.position.set(mid.x, railHeight * 0.5, mid.z);
        seg.lookAt(p2.x, mid.y, p2.z);
        scene.add(seg);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. DUST PARTICLES — Floating in zero gravity
  // ═════════════════════════════════════════════════════════════════════════

  function buildDust() {
    const geo = new THREE.SphereGeometry(0.025, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x8899cc, transparent: true, opacity: 0.22, depthWrite: false,
    });
    dustMesh = new THREE.InstancedMesh(geo, mat, DUST_N);
    dustMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < DUST_N; i++) {
      const t = Math.random();
      const base = spline.getPointAt(t);
      const tan = spline.getTangentAt(t);
      const nx = -tan.z, nz = tan.x;
      const nLen = Math.sqrt(nx * nx + nz * nz);
      const nnx = nx / (nLen || 1), nnz = nz / (nLen || 1);
      const perpSpread = (Math.random() - 0.5) * CORRIDOR_HALF_W * 1.8;
      const fwdSpread = (Math.random() - 0.5) * 6;
      const p = new THREE.Vector3(
        base.x + nnx * perpSpread + tan.x * fwdSpread,
        Math.random() * WALL_HEIGHT,
        base.z + nnz * perpSpread + tan.z * fwdSpread,
      );
      dustBase.push(p.clone());
      dustPhase.push(Math.random() * Math.PI * 2);
      _d.position.copy(p);
      _d.updateMatrix();
      dustMesh.setMatrixAt(i, _d.matrix);
    }
    dustMesh.instanceMatrix.needsUpdate = true;
    scene.add(dustMesh);
  }

  // ═════════════════════════════════════════════════════════════════════════
  //    THE CORE VISUAL CONTENT — must match the reference image
  // ═════════════════════════════════════════════════════════════════════════

  // Flat geometry is used explicitly to keep images exactly like pristine, rigid photo frames

  function buildArtworkPanel(meta: ArtworkMeta, pathPt: THREE.Vector3, t: number, idx: number) {
    const tangent = spline.getTangentAt(t);
    const normal  = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const sideSign = meta.side === 'left' ? 1 : -1;

    // Flush offset: The painting centers sit mere centimeters off the tightly curving tunnel.
    // By keeping them flat, their edges naturally embed slightly into the concrete, fulfilling
    // the 'sticker/attached' request flawlessly without concave distortions.
    const wallDist = 5.10;

    const panelX = pathPt.x + normal.x * wallDist * sideSign;
    const panelZ = pathPt.z + normal.z * wallDist * sideSign;
    // Exactly centered on the absolute center height of the 8 meter wall
    const panelY = 3.8;

    // ── MeshBasicMaterial — completely ignores all scene lighting ──
    // Shows the texture at its EXACT original pixel colors. No tinting, no darkening.
    const panelMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      fog: false,  // CRITICAL: Prevents the dark scene fog from tinting photo colors
    });

    // Gallery scale expanded dramatically following approval. 4.0 meters grants the huge 
    // cinematic presence requested while remaining physically flat to the viewer.
    const MAX_DIM = 4.0; 
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), panelMat);
    panel.position.set(panelX, panelY, panelZ);
    panel.lookAt(pathPt.x, panelY, pathPt.z);

    // Load the real image with robust error handling and combined layout logic
    sharedLoader.load(
      meta.img, 
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        panelMat.map = tex;
        panelMat.needsUpdate = true;

        // Read the real pixel dimensions from the loaded image
        const imgW = tex.image.width;
        const imgH = tex.image.height;
        const aspect = imgW / imgH;

        // Scale to fit within MAX_DIM while preserving aspect ratio
        let w: number, h: number;
        if (aspect >= 1) {
          // Landscape
          w = MAX_DIM;
          h = MAX_DIM / aspect;
        } else {
          // Portrait
          h = MAX_DIM;
          w = MAX_DIM * aspect;
        }

        // Revert to a standard, pristine flat plane so pictures are absolutely straight
        panel.geometry.dispose();
        panel.geometry = new THREE.PlaneGeometry(w, h);

        // Position the label dynamically based on final height
        label.position.set(0, -h/2 - 0.25, -0.01);
      },
      undefined,
      (err) => {
        console.error(`Museum: Failed to load artwork texture [${meta.img}]`, err);
      }
    );
    // shadows disabled globally — no castShadow needed

    // Safely store drift metadata using standard Three.js userData
    panel.userData.phase   = idx * 1.57;
    panel.userData.basePos = panel.position.clone();
    panel.userData.baseRot = new THREE.Euler().copy(panel.rotation);
    panel.userData.hScale  = 1.0;
    panel.userData.tScale  = 1.0;

    scene.add(panel);
    artworkMeshes.push(panel);
    artworkData.set(panel, meta);

    // No border — images display naturally

    // ── LABEL — Title + artist below the panel ──
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512; labelCanvas.height = 80;
    const lctx = labelCanvas.getContext('2d')!;
    
    // Clear background
    lctx.clearRect(0, 0, 512, 80);
    
    // Title
    lctx.font = '600 32px "Inter", system-ui, sans-serif';
    lctx.fillStyle = '#ffffff';
    lctx.textAlign = 'center';
    lctx.fillText(meta.title.toUpperCase(), 256, 36);
    
    // Artist
    lctx.font = '400 20px "Inter", system-ui, sans-serif';
    lctx.fillStyle = '#8899aa'; // Soft bluish-grey for refined look
    lctx.fillText(meta.artist, 256, 68);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    labelTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    // Standard flat label
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 0.45), 
      new THREE.MeshBasicMaterial({
        map: labelTex, 
        transparent: true, 
        depthWrite: false,
        fog: false // Prevent fog from darkening the text
      })
    );
    
    // Position below the painting. The placeholder plane is 1x1 initially,
    // so we must attach and offset it based on the maximum scaled dimensions.
    // Instead of waiting for texture to load to position it, we can anchor it
    // slightly below the max possible bounds, or update its Y dynamically.
    label.position.set(0, -3.2, 0.02);
    
    // Label positioning is now securely handled inside the main sharedLoader logic above
    // to strictly prevent duplicate network requests and race conditions.
    
    panel.add(label);

    // No per-panel bulb lights — ceiling tube lights provide illumination
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 10. VIVID PROCEDURAL TEXTURE — Bright nebula/cosmic art
  //     Must look like the colorful panels in the reference image
  // ═════════════════════════════════════════════════════════════════════════

  function generateVividTexture(colors: string[], idx: number): THREE.CanvasTexture {
    const CW = 1024, CH = 768;
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const ctx = c.getContext('2d')!;

    // Deep dark base
    ctx.fillStyle = '#030308';
    ctx.fillRect(0, 0, CW, CH);

    // Seed random for this panel (deterministic per panel)
    let seed = idx * 37 + 7;
    const srand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

    // Layer 1: Large background blooms
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) {
      const cx = CW * (0.15 + srand() * 0.7);
      const cy = CH * (0.15 + srand() * 0.7);
      const r  = 180 + srand() * 280;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0.0, colors[i % colors.length] + 'aa');
      grad.addColorStop(0.4, colors[(i + 1) % colors.length] + '55');
      grad.addColorStop(1.0, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CW, CH);
    }

    // Layer 2: Bright hot spots
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 8; i++) {
      const cx = CW * (0.1 + srand() * 0.8);
      const cy = CH * (0.1 + srand() * 0.8);
      const r  = 60 + srand() * 140;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0.0, colors[i % colors.length] + 'cc');
      grad.addColorStop(0.3, colors[(i + 2) % colors.length] + '44');
      grad.addColorStop(1.0, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CW, CH);
    }

    // Layer 3: Center white-hot bloom
    const cGrad = ctx.createRadialGradient(CW * 0.5, CH * 0.45, 0, CW * 0.5, CH * 0.45, 180);
    cGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
    cGrad.addColorStop(0.3, colors[0] + '44');
    cGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cGrad;
    ctx.fillRect(0, 0, CW, CH);

    // Layer 4: Scattered bright star points
    for (let i = 0; i < 80; i++) {
      const x = srand() * CW;
      const y = srand() * CH;
      const s = 1 + srand() * 2.5;
      const sg = ctx.createRadialGradient(x, y, 0, x, y, s * 3);
      sg.addColorStop(0, '#ffffff');
      sg.addColorStop(0.4, colors[Math.floor(srand() * colors.length)] + '66');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
    }

    // Layer 5: Wispy filament lines (nebula tendrils)
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = colors[1] + '22';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      let px = srand() * CW, py = srand() * CH;
      ctx.moveTo(px, py);
      for (let j = 0; j < 8; j++) {
        px += (srand() - 0.5) * 200;
        py += (srand() - 0.5) * 150;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 11. AMBIENT LIGHTING — Cool toned, subtle fill
  // ═════════════════════════════════════════════════════════════════════════

  function buildAmbientLighting() {
    // Bright neutral ambient — gallery lighting
    scene.add(new THREE.AmbientLight(0xd0d0d8, 1.5));

    // Warm cream-tinted ambient — gallery warmth
    const dir = new THREE.DirectionalLight(0xf5f0e8, 1.1);
    dir.position.set(0, 15, 10);
    scene.add(dir);
    reflectorHidden.push(dir);

    // Hemisphere: warm cream sky ← → cool steel ground = dramatic contrast
    const hemi = new THREE.HemisphereLight(0xf0e8d8, 0x303040, 0.9);
    scene.add(hemi);

    // Blue-white entrance spotlight — draws you in
    const spot = new THREE.SpotLight(0x4455dd, 2.5, 50, Math.PI / 4, 0.4);
    spot.position.set(0, 8, 5);
    spot.target.position.set(0, 0, -25);
    scene.add(spot);
    scene.add(spot.target);
    reflectorHidden.push(spot);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 12. POST-PROCESSING PIPELINE
  // ═════════════════════════════════════════════════════════════════════════

  function buildPostProcessing(): EffectComposer {
    const comp = new EffectComposer(renderer);
    comp.addPass(new RenderPass(scene, camera));

    // Bloom removed entirely — preserves exact pixel-accurate photo colors
    // Only FXAA remains for clean anti-aliasing
    
    // FXAA
    const fxaa = new ShaderPass(FXAAShader);
    const pr = Math.min(window.devicePixelRatio, 1.5);
    fxaa.material.uniforms['resolution'].value.set(1 / (W() * pr), 1 / (H() * pr));
    comp.addPass(fxaa);

    // CRITICAL: OutputPass mathematically converts the linear pipeline back to sRGB.
    // Without this, the browser displays linear color values directly, drastically darkening the photos.
    const outputPass = new OutputPass();
    comp.addPass(outputPass);

    return comp;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 13. INTERACTION — Raycaster hover + Click focus mode
  // ═════════════════════════════════════════════════════════════════════════

  const onMouseMove = (e: MouseEvent) => {
    mouse2D.x = ( e.clientX / W()) * 2 - 1;
    mouse2D.y = -(e.clientY / H()) * 2 + 1;
    // Normalized mouse for head-turning (-1 to +1)
    mouseNX   = ( e.clientX / W() - 0.5) * 2;
    mouseNY   = -(e.clientY / H() - 0.5) * 2;
  };
  canvas.addEventListener('mousemove', onMouseMove);

  const onCanvasClick = () => {
    if (isFocused) { exitFocus(); return; }
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(artworkMeshes);
    if (hits.length > 0) enterFocus(hits[0].object as THREE.Mesh);
  };
  canvas.addEventListener('click', onCanvasClick);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFocused) exitFocus();
  };
  document.addEventListener('keydown', onKeyDown);

  function enterFocus(mesh: THREE.Mesh) {
    isFocused   = true;
    focusedMesh = mesh;
    const meta  = artworkData.get(mesh)!;

    // Camera flies to 3.5 units in front of the panel (+Z is the face looking into the room now)
    const panelFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
    const camDest  = mesh.position.clone().add(panelFwd.multiplyScalar(3.5));
    camDest.y = mesh.position.y; // Match panel height
    focusCamTarget = mesh.position.clone();

    gsap.to(camera.position, {
      x: camDest.x, y: camDest.y, z: camDest.z,
      duration: 1.6, ease: 'power3.inOut',
    });

    // Cinematic dim: darken all OTHER panels
    artworkMeshes.forEach(m => {
      if (m !== mesh) {
        gsap.to(m.material, { opacity: 0.3, duration: 1.0 });
      }
    });
    artworkLights.forEach((l, i) => {
      if (artworkMeshes[i] !== mesh) gsap.to(l, { intensity: 0.15, duration: 1.0 });
    });

    // Boost focused panel (scale is handled via click target state)
    // Removed bloomPass animation

    showOverlay(meta);
  }

  function exitFocus() {
    isFocused = false;
    focusedMesh = null;
    focusCamTarget = null;

    // Return camera to spline position
    const pathPos = spline.getPointAt(curT);
    gsap.to(camera.position, {
      x: pathPos.x, y: pathPos.y, z: pathPos.z,
      duration: 1.4, ease: 'power3.inOut',
    });

    // Restore all panels
    artworkMeshes.forEach(m => {
      gsap.killTweensOf(m.material);
      // Restore opacity if it was changed
      gsap.to(m.material, { opacity: 1.0, duration: 0.8 });
    });
    artworkLights.forEach(l => gsap.to(l, { intensity: 4.5, duration: 0.8 }));
    // Removed bloomPass animation

    hideOverlay();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 14. GLASSMORPHISM OVERLAY — with image preview
  // ═════════════════════════════════════════════════════════════════════════

  function showOverlay(meta: ArtworkMeta) {
    if (!overlay) return;
    // Stripped all metadata panels so the user gets a pure, unadulterated fullscreen 
    // view of their photography without ugly placeholder text blocking it.
    overlay.innerHTML = `
      <div style="position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); 
                  background: rgba(0,0,0,0.6); padding: 0.8rem 1.5rem; border-radius: 30px; 
                  color: #fff; font-family: sans-serif; font-size: 0.8rem; letter-spacing: 0.1em;
                  backdrop-filter: blur(10px); pointer-events: none;">
        Press ESC or click anywhere to close
      </div>
    `;
    overlay.classList.add('is-active');
    // CRITICAL: Prevent the otherwise invisible overlay from eating global click events
    overlay.style.pointerEvents = 'none';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove('is-active');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 15. ANIMATION LOOP
  // ═════════════════════════════════════════════════════════════════════════

  let animationFrameId: number;

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const now = performance.now();
    const sec = (now - startTime) / 1000;

    // FPS tracking and adaptive quality
    frameCount++;
    if (now - lastFpsT > 1200) {
      curFps = Math.round((frameCount * 1000) / (now - lastFpsT));
      frameCount = 0;
      lastFpsT = now;
      
      // Adaptive Quality Engine: 
      // If a device struggles to hit 45 FPS, permanently drop the Pixel Ratio config
      // to 1.0. This buys enormous GPU headroom on older devices/laptops without resizing.
      if (curFps < 45 && renderer.getPixelRatio() > 1.0) {
        console.log(`[ANTIK] High load detected (${curFps} FPS). Activating performance mode.`);
        renderer.setPixelRatio(1.0);
        // Force composer/fxaa updates for the new resolution
        const w = W(), h = H();
        composer.setSize(w, h);
        const fxaa = composer.passes[composer.passes.length - 1] as ShaderPass;
        if (fxaa?.material?.uniforms?.['resolution']) {
          fxaa.material.uniforms['resolution'].value.set(1 / w, 1 / h);
        }
      }
    }

    // ── Physics-based camera movement ──
    if (!isFocused) {
      // Simple lerp — direct follow, no bounce
      curT += (targetT - curT) * LERP_SPEED;
      // Snap when very close
      if (Math.abs(targetT - curT) < 0.0001) curT = targetT;

      const pathPos = spline.getPointAt(curT);

      // Zero-gravity micro-float breathing — subtle "drift" effect
      const bx = Math.sin(sec * 0.35) * 0.03 + Math.cos(sec * 0.67) * 0.015;
      const by = Math.sin(sec * 0.25) * 0.04 + Math.cos(sec * 0.53) * 0.02;
      const bz = Math.sin(sec * 0.19) * 0.008;

      camera.position.set(pathPos.x + bx, pathPos.y + by, pathPos.z + bz);

      // ── MOUSE-DRIVEN VIEW ROTATION — look around freely ──
      smoothMX += (mouseNX - smoothMX) * 0.06;
      smoothMY += (mouseNY - smoothMY) * 0.06;

      // Look ahead on the spline, extrapolate if at the very end
      const lookT = curT + 0.02;
      let lookAhead: THREE.Vector3;
      if (lookT <= 1) {
        lookAhead = spline.getPointAt(lookT);
      } else {
        const endPt = spline.getPointAt(1.0);
        const tan = spline.getTangentAt(1.0);
        lookAhead = endPt.add(tan.multiplyScalar(2.0)); // Extrapolate 2 units forward
      }

      camera.lookAt(
        lookAhead.x + smoothMX * 2.5,  // Significant horizontal rotation
        lookAhead.y + smoothMY * 1.5,  // Meaningful vertical tilt
        lookAhead.z
      );
    } else if (focusCamTarget) {
      // During focus: camera slowly tracks the artwork with slight mouse influence
      const target = focusCamTarget.clone();
      target.x += mouseNX * 0.3;
      target.y += mouseNY * 0.2;
      camera.lookAt(target);
    }

    // ── Artwork hover ──
    if (!isFocused) {
      raycaster.setFromCamera(mouse2D, camera);
      const hits = raycaster.intersectObjects(artworkMeshes);
      const hitSet = new Set(hits.map(h => h.object));

      artworkMeshes.forEach(m => {
        const hovered = hitSet.has(m);
        m.userData.tScale = hovered ? 1.06 : 1.0;
        m.userData.hScale += (m.userData.tScale - m.userData.hScale) * 0.07;
        m.scale.setScalar(m.userData.hScale);

        // MeshBasicMaterial doesn't use emissiveIntensity
      });
      canvas.style.cursor = hits.length > 0 ? 'pointer' : 'default';
    }

    // ── Artwork slow drift ──
    artworkMeshes.forEach(m => {
      const ph   = m.userData.phase;
      const base = m.userData.basePos as THREE.Vector3;
      const bRot = m.userData.baseRot as THREE.Euler;

      m.position.y = base.y + Math.sin(sec * 0.3 + ph) * 0.04;
      m.rotation.y = bRot.y + Math.sin(sec * 0.15 + ph) * 0.005;
    });

    // ── Artwork light pulse ──
    artworkLights.forEach((light, i) => {
      light.intensity = 4.5 + Math.sin(sec * 0.5 + i * 1.1) * 0.5;
    });

    // ── Dust drift ──
    for (let i = 0; i < DUST_N; i++) {
      const ph = dustPhase[i];
      const b = dustBase[i];
      _d.position.set(
        b.x + Math.sin(sec * 0.1 + ph) * 0.35,
        b.y + Math.sin(sec * 0.14 + ph * 1.3) * 0.45,
        b.z + Math.cos(sec * 0.08 + ph * 0.7) * 0.3,
      );
      _d.scale.setScalar(0.8 + Math.sin(sec * 0.4 + ph) * 0.2);
      _d.updateMatrix();
      dustMesh.setMatrixAt(i, _d.matrix);
    }
    dustMesh.instanceMatrix.needsUpdate = true;

    composer.render();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 16. SCROLL HANDLER
  // ═════════════════════════════════════════════════════════════════════════

  function onScroll() {
    const scrollY = window.scrollY;
    
    // The Hero sticky section completes its internal scrub exactly when scroll reaches (HERO_PX - window_height).
    // If we wait for HERO_PX, the user scrubs a whole empty 100vh black void as the sticky box scrolls off screen!
    const HERO_SCROLL_END = HERO_PX - window.innerHeight;
    
    // We start processing internal Museum scroll distance right as the lens zoom finishes.
    const raw = (scrollY - HERO_SCROLL_END) / MUSEUM_PX;
    targetT   = Math.max(0, Math.min(1, raw));

    // Fade the Museum canvas in EARLY (at 80% of the Hero Scrub) so it smoothly 
    // masks the hollow black center of the camera lens zoom.
    const inMuseumZone = scrollY >= HERO_SCROLL_END * 0.80 && scrollY <= HERO_SCROLL_END + MUSEUM_PX + window.innerHeight;
    
    canvas.style.opacity       = inMuseumZone ? '1' : '0';
    canvas.style.pointerEvents = inMuseumZone ? 'auto' : 'none';
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ═════════════════════════════════════════════════════════════════════════
  // 17. RESIZE
  // ═════════════════════════════════════════════════════════════════════════

  const onResize = () => {
    measure();
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
    composer.setSize(W(), H());
    const pr = Math.min(window.devicePixelRatio, 1.5);
    const fxaa = composer.passes[composer.passes.length - 1] as ShaderPass;
    if (fxaa?.material?.uniforms?.['resolution']) {
      fxaa.material.uniforms['resolution'].value.set(1 / (W() * pr), 1 / (H() * pr));
    }
  };
  window.addEventListener('resize', onResize, { passive: true });

  // ═════════════════════════════════════════════════════════════════════════
  // START
  // ═════════════════════════════════════════════════════════════════════════

  canvas.style.opacity       = '0';
  canvas.style.transition    = 'opacity 0.7s ease';
  canvas.style.pointerEvents = 'none';

  animate();
  console.log('✦ ANTIK Museum — Space Gallery online.');

  return {
    dispose: () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onCanvasClick);
      document.removeEventListener('keydown', onKeyDown);
      scene.traverse((object) => {
        if (!(object as THREE.Mesh).isMesh) return;
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      renderer.dispose();
    }
  };
}
