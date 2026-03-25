"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ── Helix geometry constants ──────────────────────────────────────────────
const TURNS = 8;
const PPS = 42; // points per strand per turn
const N = TURNS * PPS;
const HELIX_R = 1.8;
const PITCH = 0.52;
const RUNG_STEP = Math.round(PPS / 5);
const HOVER_RADIUS = 0.9; // world-space units

// ── Color helpers ─────────────────────────────────────────────────────────
function makeColorArray(hex: string): Float32Array {
  const c = new THREE.Color(hex);
  const arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  return arr;
}

function buildHelix() {
  const totalH = TURNS * PITCH;
  const s1: number[] = [];
  const s2: number[] = [];
  const rg: number[] = [];

  for (let i = 0; i < N; i++) {
    const t = (i / N) * TURNS * Math.PI * 2;
    const y = (i / N) * totalH - totalH / 2;

    const x1 = Math.cos(t) * HELIX_R;
    const z1 = Math.sin(t) * HELIX_R;
    s1.push(x1, y, z1);

    const x2 = Math.cos(t + Math.PI) * HELIX_R;
    const z2 = Math.sin(t + Math.PI) * HELIX_R;
    s2.push(x2, y, z2);

    if (i % RUNG_STEP === 0) rg.push(x1, y, z1, x2, y, z2);
  }

  return {
    strand1: new Float32Array(s1),
    strand2: new Float32Array(s2),
    rungs: new Float32Array(rg),
    rungCount: rg.length / 3,
  };
}

// ── Shared reusable objects (never recreated) ─────────────────────────────
const _vec = new THREE.Vector3();
const _col = new THREE.Color();
const _hot = new THREE.Color("#ffffff");
const _cyanBase = new THREE.Color("#00e5ff");
const _pinkBase = new THREE.Color("#ff3b9a");

function refreshColors(
  strand: Float32Array,
  colorArr: Float32Array,
  base: THREE.Color,
  ray: THREE.Ray,
  world: THREE.Matrix4,
  attr: THREE.BufferAttribute | null,
) {
  for (let i = 0; i < N; i++) {
    _vec.fromArray(strand, i * 3).applyMatrix4(world);
    const d = ray.distanceToPoint(_vec);
    const t = Math.max(0, 1 - d / HOVER_RADIUS) ** 2.2;
    _col.copy(base).lerp(_hot, t);
    colorArr[i * 3]     = _col.r;
    colorArr[i * 3 + 1] = _col.g;
    colorArr[i * 3 + 2] = _col.b;
  }
  if (attr) attr.needsUpdate = true;
}

// ── DoubleHelix component ─────────────────────────────────────────────────
function DoubleHelix() {
  const groupRef = useRef<THREE.Group>(null!);
  const { strand1, strand2, rungs, rungCount } = useMemo(buildHelix, []);

  // Mutable color arrays — modified in place each frame
  const colors1 = useMemo(() => makeColorArray("#00e5ff"), []);
  const colors2 = useMemo(() => makeColorArray("#ff3b9a"), []);

  const col1Ref = useRef<THREE.BufferAttribute>(null!);
  const col2Ref = useRef<THREE.BufferAttribute>(null!);

  useFrame(({ clock, pointer, camera, raycaster }) => {
    const g = groupRef.current;
    if (!g) return;

    // Rotation + mouse parallax
    g.rotation.y = clock.elapsedTime * 0.16;
    g.rotation.x = pointer.y * 0.1;
    g.rotation.z = -pointer.x * 0.05;

    // Sync raycaster with current pointer
    raycaster.setFromCamera(pointer, camera);
    const ray = raycaster.ray;
    g.updateMatrixWorld();

    refreshColors(strand1, colors1, _cyanBase, ray, g.matrixWorld, col1Ref.current);
    refreshColors(strand2, colors2, _pinkBase, ray, g.matrixWorld, col2Ref.current);
  });

  return (
    <group ref={groupRef}>
      {/* Strand A — glow halo (fixed cyan) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[strand1, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.22} color="#00e5ff" transparent opacity={0.09} sizeAttenuation depthWrite={false} />
      </points>

      {/* Strand A — core (vertex colors, hover-reactive) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[strand1, 3]} />
          <bufferAttribute ref={col1Ref} attach="attributes-color" args={[colors1, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors sizeAttenuation />
      </points>

      {/* Strand B — glow halo (fixed pink) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[strand2, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.22} color="#ff3b9a" transparent opacity={0.09} sizeAttenuation depthWrite={false} />
      </points>

      {/* Strand B — core (vertex colors, hover-reactive) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[strand2, 3]} />
          <bufferAttribute ref={col2Ref} attach="attributes-color" args={[colors2, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors sizeAttenuation />
      </points>

      {/* Connecting rungs */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rungs, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#e5e2e1" transparent opacity={0.1} />
      </lineSegments>
    </group>
  );
}

// ── Star streaks — space travel effect ───────────────────────────────────
const STAR_COUNT = 380;
const TRAVEL_SPEED = 9; // world-units / second
const Z_RESET = -70;
const Z_CLIP  = 13;
// Background colour in linear [0,1] — matches #0e0e0e
const BG = 0.055;

function initStars() {
  const pos    = new Float32Array(STAR_COUNT * 6); // 2 verts × 3 coords
  const colors = new Float32Array(STAR_COUNT * 6); // 2 verts × 3 rgb

  for (let i = 0; i < STAR_COUNT; i++) {
    const j = i * 6;
    const x     = (Math.random() - 0.5) * 44;
    const y     = (Math.random() - 0.5) * 44;
    const z     = Math.random() * (Z_CLIP - Z_RESET) + Z_RESET; // spread evenly
    const trail = 0.2 + Math.random() * 0.7;
    const bright = 0.45 + Math.random() * 0.35;

    // front vertex
    pos[j]   = x; pos[j+1] = y; pos[j+2] = z;
    colors[j] = bright; colors[j+1] = bright; colors[j+2] = bright;

    // back vertex (tail fades to background)
    pos[j+3] = x; pos[j+4] = y; pos[j+5] = z - trail;
    colors[j+3] = BG; colors[j+4] = BG; colors[j+5] = BG;
  }
  return { pos, colors };
}

function StarStreaks() {
  const posAttrRef = useRef<THREE.BufferAttribute>(null!);
  const { pos, colors } = useMemo(initStars, []);

  useFrame((_, dt) => {
    const attr = posAttrRef.current;
    if (!attr) return;
    const arr = attr.array as Float32Array;

    for (let i = 0; i < STAR_COUNT; i++) {
      const j = i * 6;
      arr[j+2] += TRAVEL_SPEED * dt; // front z
      arr[j+5] += TRAVEL_SPEED * dt; // back z

      // reset star to the far end when it flies past camera
      if (arr[j+2] > Z_CLIP) {
        const x     = (Math.random() - 0.5) * 44;
        const y     = (Math.random() - 0.5) * 44;
        const trail = arr[j+2] - arr[j+5]; // preserve original trail length
        arr[j]   = x; arr[j+1] = y; arr[j+2] = Z_RESET;
        arr[j+3] = x; arr[j+4] = y; arr[j+5] = Z_RESET - trail;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute ref={posAttrRef} attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors />
    </lineSegments>
  );
}

// ── Scene root ────────────────────────────────────────────────────────────
export function ThreeScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 10], fov: 45 }}
      gl={{ antialias: true }}
      style={{ background: "#0e0e0e" }}
    >
      <DoubleHelix />
      <StarStreaks />
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.4} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.05} intensity={2.2} mipmapBlur radius={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
