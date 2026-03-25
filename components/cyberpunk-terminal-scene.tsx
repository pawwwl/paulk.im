"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C_GREEN = "#00ff41";
const C_CYAN  = "#00e5ff";
const C_PINK  = "#ff0080";
const C_AMBER = "#ffb800";

// ─── Matrix Code Rain ────────────────────────────────────────────────────────
const COLS  = 62;
const TRAIL = 26;
const RAIN_W = 26;
const RAIN_H = 20;
const TOTAL  = COLS * TRAIL;

function setDropColor(arr: Float32Array, i: number, t: number) {
  if (t === 0) {
    arr[i * 3] = 0.85; arr[i * 3 + 1] = 1.0; arr[i * 3 + 2] = 0.9;
  } else if (t === 1) {
    arr[i * 3] = 0.0;  arr[i * 3 + 1] = 1.0; arr[i * 3 + 2] = 0.25;
  } else {
    const b = Math.max(0, 1 - t / (TRAIL * 0.72)) * 0.65;
    arr[i * 3] = 0; arr[i * 3 + 1] = b; arr[i * 3 + 2] = b * 0.12;
  }
}

function MatrixRain() {
  const posRef = useRef<THREE.BufferAttribute>(null!);
  const colRef = useRef<THREE.BufferAttribute>(null!);

  const { positions, colors, colX, headY, speeds } = useMemo(() => {
    const positions = new Float32Array(TOTAL * 3);
    const colors    = new Float32Array(TOTAL * 3);
    const colX  = new Float32Array(COLS);
    const headY = new Float32Array(COLS);
    const speeds = new Float32Array(COLS);

    for (let c = 0; c < COLS; c++) {
      colX[c]   = (c / (COLS - 1)) * RAIN_W - RAIN_W / 2;
      headY[c]  = (Math.random() - 0.5) * RAIN_H;
      speeds[c] = 2.5 + Math.random() * 10;

      for (let t = 0; t < TRAIL; t++) {
        const i = c * TRAIL + t;
        positions[i * 3]     = colX[c];
        positions[i * 3 + 1] = headY[c] + t * 0.3;
        positions[i * 3 + 2] = -12 + (c % 5) * 0.4;
        setDropColor(colors, i, t);
      }
    }
    return { positions, colors, colX, headY, speeds };
  }, []);

  useFrame((_, dt) => {
    const posArr = posRef.current?.array as Float32Array;
    const colArr = colRef.current?.array as Float32Array;
    if (!posArr) return;

    for (let c = 0; c < COLS; c++) {
      headY[c] -= speeds[c] * dt;
      if (headY[c] < -RAIN_H / 2 - TRAIL * 0.3) {
        headY[c] = RAIN_H / 2 + Math.random() * 6;
      }
      for (let t = 0; t < TRAIL; t++) {
        const i = c * TRAIL + t;
        posArr[i * 3]     = colX[c];
        posArr[i * 3 + 1] = headY[c] + t * 0.3;
        setDropColor(colArr, i, t);
      }
    }
    posRef.current.needsUpdate = true;
    colRef.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute ref={posRef} attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute ref={colRef} attach="attributes-color"   args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        sizeAttenuation
        depthWrite={false}
        transparent
        opacity={0.92}
      />
    </points>
  );
}

// ─── Holographic Grid Floor ───────────────────────────────────────────────────
function GridFloor() {
  const ref = useRef<THREE.LineSegments>(null!);

  const geo = useMemo(() => {
    const N = 28, S = 36, pts: number[] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * S - S / 2;
      pts.push(x, -4, -S / 2, x, -4, S / 2);
    }
    for (let i = 0; i <= N; i++) {
      const z = (i / N) * S - S / 2;
      pts.push(-S / 2, -4, z, S / 2, -4, z);
    }
    return new Float32Array(pts);
  }, []);

  useFrame(({ clock }) => {
    if (ref.current)
      (ref.current.material as THREE.LineBasicMaterial).opacity =
        0.1 + 0.04 * Math.sin(clock.elapsedTime * 0.6);
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geo, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={C_CYAN} transparent opacity={0.12} />
    </lineSegments>
  );
}

// ─── Terminal Frame & Screen ──────────────────────────────────────────────────
const TW = 6.0, TH = 4.2;

function buildFrameGeo() {
  const hw = TW / 2, hh = TH / 2, z = 0.12, cs = 0.55;
  const pts: number[] = [
    // outer rect
    -hw,-hh,z,  hw,-hh,z,
     hw,-hh,z,  hw, hh,z,
     hw, hh,z, -hw, hh,z,
    -hw, hh,z, -hw,-hh,z,
    // corner brackets (outward)
    -hw, hh,z, -hw, hh+cs,z,   -hw,hh,z, -hw-cs,hh,z,
     hw, hh,z,  hw, hh+cs,z,    hw,hh,z,  hw+cs,hh,z,
    -hw,-hh,z, -hw,-hh-cs,z,  -hw,-hh,z, -hw-cs,-hh,z,
     hw,-hh,z,  hw,-hh-cs,z,   hw,-hh,z,  hw+cs,-hh,z,
    // inner corner insets (tic marks inside corners)
    -hw+0.3, hh,z, -hw+0.3, hh-0.3,z,   -hw,hh-0.3,z, -hw+0.3,hh-0.3,z,
     hw-0.3, hh,z,  hw-0.3, hh-0.3,z,    hw,hh-0.3,z,  hw-0.3,hh-0.3,z,
    -hw+0.3,-hh,z, -hw+0.3,-hh+0.3,z,  -hw,-hh+0.3,z, -hw+0.3,-hh+0.3,z,
     hw-0.3,-hh,z,  hw-0.3,-hh+0.3,z,   hw,-hh+0.3,z,  hw-0.3,-hh+0.3,z,
    // center reticle
    -0.18,0,z, 0.18,0,z,  0,-0.18,z, 0,0.18,z,
    // bottom bar
    -hw,-hh-0.55,z, hw,-hh-0.55,z,
    // bottom pip indicators
    -0.8,-hh-0.55,z, -0.8,-hh-0.3,z,
     0.0,-hh-0.55,z,  0.0,-hh-0.3,z,
     0.8,-hh-0.55,z,  0.8,-hh-0.3,z,
  ];
  return new Float32Array(pts);
}

const FRAME_GEO = buildFrameGeo();

function TerminalFrame() {
  const groupRef = useRef<THREE.Group>(null!);
  const scanRef  = useRef<THREE.Mesh>(null!);
  const glowRef  = useRef<THREE.Mesh>(null!);

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.y  = Math.sin(t * 0.38) * 0.22;
      groupRef.current.rotation.y  = pointer.x * 0.09 + Math.sin(t * 0.22) * 0.03;
      groupRef.current.rotation.x  = -pointer.y * 0.05;
    }

    // scanline sweep — top to bottom
    if (scanRef.current) {
      const cycle = (t * 0.75) % 1;
      scanRef.current.position.y = TH / 2 - cycle * TH;
      const mat = scanRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 * Math.sin(cycle * Math.PI);
    }

    // subtle screen glow flicker
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + (Math.random() < 0.015 ? Math.random() * 0.12 : 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* screen glow fill */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <planeGeometry args={[TW - 0.15, TH - 0.15]} />
        <meshBasicMaterial color="#001508" transparent opacity={0.06} />
      </mesh>

      {/* scanline */}
      <mesh ref={scanRef} position={[0, 0, 0.14]}>
        <planeGeometry args={[TW - 0.15, 0.05]} />
        <meshBasicMaterial color={C_GREEN} transparent opacity={0.5} />
      </mesh>

      {/* frame lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[FRAME_GEO, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={C_GREEN} />
      </lineSegments>
    </group>
  );
}

// ─── Orbiting Data Rings ──────────────────────────────────────────────────────
function DataRings() {
  const r1 = useRef<THREE.Mesh>(null!);
  const r2 = useRef<THREE.Mesh>(null!);
  const r3 = useRef<THREE.Mesh>(null!);
  const r4 = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (r1.current) { r1.current.rotation.z = t * 0.35; r1.current.rotation.y = t * 0.12; }
    if (r2.current) { r2.current.rotation.x = t * 0.28; r2.current.rotation.z = -t * 0.22; }
    if (r3.current) { r3.current.rotation.y = t * 0.45; r3.current.rotation.x = t * 0.18; }
    if (r4.current) { r4.current.rotation.z = -t * 0.3; r4.current.rotation.y = t * 0.55; }
  });

  return (
    <group>
      <mesh ref={r1}>
        <torusGeometry args={[3.4, 0.016, 4, 90]} />
        <meshBasicMaterial color={C_CYAN} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[3.9, 0.011, 4, 90]} />
        <meshBasicMaterial color={C_PINK} />
      </mesh>
      <mesh ref={r3} rotation={[Math.PI / 2, Math.PI / 5, 0]}>
        <torusGeometry args={[4.4, 0.009, 4, 90]} />
        <meshBasicMaterial color={C_GREEN} transparent opacity={0.55} />
      </mesh>
      <mesh ref={r4} rotation={[Math.PI / 7, Math.PI / 3, Math.PI / 4]}>
        <torusGeometry args={[4.9, 0.007, 4, 90]} />
        <meshBasicMaterial color={C_AMBER} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ─── Floating Data Nodes + Connections ───────────────────────────────────────
const NODES: { pos: [number, number, number]; color: string; size: number }[] = [
  { pos: [-6.8,  1.8, -2.0], color: C_CYAN,  size: 0.16 },
  { pos: [ 7.0, -0.8, -1.5], color: C_PINK,  size: 0.13 },
  { pos: [-7.5, -2.2, -3.0], color: C_GREEN, size: 0.11 },
  { pos: [ 5.5,  2.8, -2.5], color: C_AMBER, size: 0.14 },
  { pos: [-4.5, -3.5, -1.0], color: C_CYAN,  size: 0.10 },
  { pos: [ 7.5,  0.5, -3.5], color: C_GREEN, size: 0.12 },
  { pos: [-2.5,  3.5, -2.0], color: C_PINK,  size: 0.09 },
  { pos: [ 3.0, -3.0, -2.5], color: C_CYAN,  size: 0.10 },
];

const CONN_PAIRS = [[0,1],[1,3],[0,2],[3,5],[4,2],[4,1],[6,0],[7,3],[6,3],[7,4]];
const CONN_GEO = (() => {
  const pts: number[] = [];
  CONN_PAIRS.forEach(([a, b]) => pts.push(...NODES[a].pos, ...NODES[b].pos));
  return new Float32Array(pts);
})();

function FloatingNodes() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.y = NODES[i].pos[1] + Math.sin(t * 0.48 + i * 1.15) * 0.28;
      mesh.rotation.x = t * 0.55 + i * 0.5;
      mesh.rotation.y = t * 0.38 + i * 0.3;
    });
  });

  return (
    <group>
      {NODES.map((node, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={node.pos}>
          <octahedronGeometry args={[node.size, 0]} />
          <meshBasicMaterial color={node.color} wireframe />
        </mesh>
      ))}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[CONN_GEO, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={C_CYAN} transparent opacity={0.1} />
      </lineSegments>
    </group>
  );
}

// ─── Glitch Bars ─────────────────────────────────────────────────────────────
// Occasional horizontal neon bars that flicker across the screen
const GLITCH_BARS = 6;

function GlitchBars() {
  const barsRef = useRef<THREE.InstancedMesh>(null!);
  const timer   = useRef(0);
  const nextGlitch = useRef(1.5 + Math.random() * 2);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const mesh = barsRef.current;
    if (!mesh) return;
    timer.current += dt;

    if (timer.current < nextGlitch.current) {
      // hide all bars
      for (let i = 0; i < GLITCH_BARS; i++) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    } else {
      // show glitch burst
      const progress = (timer.current - nextGlitch.current) / 0.12;
      if (progress > 1) {
        timer.current = 0;
        nextGlitch.current = 1.5 + Math.random() * 3;
      }
      for (let i = 0; i < GLITCH_BARS; i++) {
        const fade = Math.max(0, 1 - progress);
        const w  = (0.5 + Math.random() * 4.5) * fade;
        const h  = 0.018 + Math.random() * 0.04;
        const x  = (Math.random() - 0.5) * (TW - w);
        const y  = (Math.random() - 0.5) * TH;
        dummy.position.set(x, y, 0.16);
        dummy.scale.set(w, h, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={barsRef} args={[undefined, undefined, GLITCH_BARS]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={C_CYAN} transparent opacity={0.55} />
    </instancedMesh>
  );
}

// ─── Data Stream Particles ────────────────────────────────────────────────────
// Bright particles shooting along the connection lines
const STREAM_COUNT = 40;

function DataStreams() {
  const posRef = useRef<THREE.BufferAttribute>(null!);
  const colRef = useRef<THREE.BufferAttribute>(null!);

  const { pos, col, ts, pairIdx } = useMemo(() => {
    const pos    = new Float32Array(STREAM_COUNT * 3);
    const col    = new Float32Array(STREAM_COUNT * 3);
    const ts     = new Float32Array(STREAM_COUNT);
    const pairIdx = new Uint8Array(STREAM_COUNT);

    for (let i = 0; i < STREAM_COUNT; i++) {
      ts[i] = Math.random();
      pairIdx[i] = Math.floor(Math.random() * CONN_PAIRS.length);
      pos[i * 3] = 0; pos[i * 3 + 1] = -100; pos[i * 3 + 2] = 0; // hidden off-screen
    }

    return { pos, col, ts, pairIdx };
  }, []);

  const _a = useMemo(() => new THREE.Vector3(), []);
  const _b = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const posArr = posRef.current?.array as Float32Array;
    const colArr = colRef.current?.array as Float32Array;
    if (!posArr) return;

    for (let i = 0; i < STREAM_COUNT; i++) {
      ts[i] += dt * (0.4 + (i % 5) * 0.12);
      if (ts[i] > 1) {
        ts[i] -= 1;
        pairIdx[i] = Math.floor(Math.random() * CONN_PAIRS.length);
      }

      const [ai, bi] = CONN_PAIRS[pairIdx[i]];
      _a.set(...NODES[ai].pos);
      _b.set(...NODES[bi].pos);
      _a.lerp(_b, ts[i]);

      posArr[i * 3]     = _a.x;
      posArr[i * 3 + 1] = _a.y;
      posArr[i * 3 + 2] = _a.z;

      // color: alternate cyan / pink
      if (i % 2 === 0) {
        colArr[i * 3] = 0; colArr[i * 3 + 1] = 0.9; colArr[i * 3 + 2] = 1.0;
      } else {
        colArr[i * 3] = 1; colArr[i * 3 + 1] = 0; colArr[i * 3 + 2] = 0.5;
      }
    }
    posRef.current.needsUpdate = true;
    colRef.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute ref={posRef} attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute ref={colRef} attach="attributes-color"   args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.14} vertexColors sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────
export function CyberpunkTerminalScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 10], fov: 55 }}
      gl={{ antialias: true }}
      style={{ background: "#000a05" }}
    >
      <MatrixRain />
      <GridFloor />
      <DataRings />
      <FloatingNodes />
      <DataStreams />
      <TerminalFrame />
      <GlitchBars />
      <EffectComposer>
        <Bloom luminanceThreshold={0.02} intensity={3.8} mipmapBlur radius={0.8} />
        <Vignette eskil={false} offset={0.12} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
