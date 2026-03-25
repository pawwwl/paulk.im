"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { ReactNode } from "react";

// ─── Parallax wrapper ─────────────────────────────────────────────────────────
function ParallaxLayer({ factor, children }: { factor: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ pointer }) => {
    const g = ref.current;
    if (!g) return;
    g.position.x += (pointer.x * factor * 2.8 - g.position.x) * 0.065;
    g.position.y += (-pointer.y * factor * 1.3 - g.position.y) * 0.065;
  });
  return <group ref={ref}>{children}</group>;
}

// ─── Sky & atmospheric glow ───────────────────────────────────────────────────
function AtmosphericSky() {
  const { pts, cols } = useMemo(() => {
    const pts: number[] = [], cols: number[] = [];

    // Wide amber sky fill
    for (let i = 0; i < 4800; i++) {
      const x = (Math.random() - 0.5) * 22;
      const y = Math.random() * 10 - 1.5;
      pts.push(x, y, -15 + Math.random() * 2);
      const d = Math.sqrt(x * x + (y - 0.5) * (y - 0.5));
      const bright = Math.max(0, 1 - d / 7);
      cols.push(
        Math.min(1, 0.45 + bright * 0.55),
        Math.min(1, 0.18 + bright * 0.52),
        bright * 0.08
      );
    }

    // Concentrated glow at vanishing point — Gaussian cluster
    for (let i = 0; i < 3200; i++) {
      const r     = Math.sqrt(-2 * Math.log(Math.random() + 1e-4)) * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta) * 1.2;
      const y = r * Math.sin(theta) * 0.75 - 0.2;
      pts.push(x, y, -14);
      const b = Math.max(0, 1 - r / 3.5);
      cols.push(
        Math.min(1, 0.88 + b * 0.12),
        Math.min(1, 0.52 + b * 0.48),
        Math.min(1, 0.05 + b * 0.38)
      );
    }

    return { pts: new Float32Array(pts), cols: new Float32Array(cols) };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
        <bufferAttribute attach="attributes-color"   args={[cols, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.38} vertexColors sizeAttenuation depthWrite={false} transparent opacity={0.72} fog={false} />
    </points>
  );
}

// ─── Tree avenue ──────────────────────────────────────────────────────────────
// Each pair: symmetric left + right trunk, + a few branches
const TREE_DEFS = [
  { z: -13, x: 1.0,  r: 0.055, h: 14 },
  { z: -10, x: 1.55, r: 0.08,  h: 15 },
  { z: -8,  x: 2.1,  r: 0.11,  h: 15 },
  { z: -6,  x: 2.8,  r: 0.15,  h: 16 },
  { z: -4,  x: 3.7,  r: 0.20,  h: 17 },
  { z: -2,  x: 4.8,  r: 0.27,  h: 19 },
];

function toneAtDepth(z: number): string {
  // Gets progressively lighter/more amber toward the back
  const t = Math.max(0, Math.min(1, (-z - 2) / 12));
  const L = Math.round(8 + t * 28);
  return `hsl(20, 72%, ${L}%)`;
}

function TrunkPair({ x, z, r, h }: { x: number; z: number; r: number; h: number }) {
  const color = toneAtDepth(z);
  const branchColor = toneAtDepth(z - 1);
  const bh = h * 0.38;

  return (
    <>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * x, h / 2 - 5.5, z]}>
          {/* Main trunk */}
          <mesh>
            <cylinderGeometry args={[r * 0.78, r, h, 6]} />
            <meshBasicMaterial color={color} />
          </mesh>
          {/* Branch left */}
          <mesh position={[side * 0, h * 0.24, 0]} rotation={[0, 0, side * 0.65]}>
            <cylinderGeometry args={[r * 0.28, r * 0.42, bh, 5]} />
            <meshBasicMaterial color={branchColor} />
          </mesh>
          {/* Branch right (opposite) */}
          <mesh position={[0, h * 0.38, 0]} rotation={[0, 0, -side * 0.55]}>
            <cylinderGeometry args={[r * 0.22, r * 0.36, bh * 0.8, 5]} />
            <meshBasicMaterial color={branchColor} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function TreeAvenue() {
  return (
    <group>
      {TREE_DEFS.map((d, i) => <TrunkPair key={i} {...d} />)}
    </group>
  );
}

// ─── Ground leaf carpet ───────────────────────────────────────────────────────
function GroundLeaves() {
  const { pts, cols } = useMemo(() => {
    const pts: number[] = [], cols: number[] = [];
    const palette = [
      [0.55, 0.15, 0.02],  // deep red-brown
      [0.78, 0.30, 0.04],  // rust orange
      [0.90, 0.48, 0.06],  // amber
      [0.96, 0.65, 0.10],  // golden orange
      [0.99, 0.80, 0.20],  // yellow-gold
      [0.60, 0.20, 0.03],  // burnt sienna
    ];

    for (let i = 0; i < 9000; i++) {
      const x  = (Math.random() - 0.5) * 20;
      const z  = -14 + Math.random() * 16;
      const y  = -3.8 + Math.random() * 0.5 + Math.abs(x) * 0.02;
      pts.push(x, y, z);
      const [r, g, b] = palette[Math.floor(Math.random() * palette.length)];
      const jit = (Math.random() - 0.5) * 0.12;
      cols.push(
        Math.min(1, r + jit),
        Math.min(1, g + jit),
        Math.min(1, b + jit)
      );
    }

    // Extra leaf pile under the main tree (right side, front)
    for (let i = 0; i < 2500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const rad   = Math.sqrt(Math.random()) * 2.8;
      pts.push(3.5 + rad * Math.cos(theta) * 1.4, -3.5 + Math.random() * 0.6, 1.5 + rad * Math.sin(theta) * 0.7);
      const [r, g, b] = palette[Math.floor(Math.random() * palette.length)];
      cols.push(Math.min(1, r + 0.05), Math.min(1, g + 0.05), Math.min(1, b));
    }

    return { pts: new Float32Array(pts), cols: new Float32Array(cols) };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
        <bufferAttribute attach="attributes-color"   args={[cols, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.21} vertexColors sizeAttenuation depthWrite={false} transparent opacity={0.96} />
    </points>
  );
}

// ─── Falling leaves ───────────────────────────────────────────────────────────
const FALL_COUNT = 70;

function FallingLeaves() {
  const posRef = useRef<THREE.BufferAttribute>(null!);
  const { pos, vx, vy, phase } = useMemo(() => {
    const pos   = new Float32Array(FALL_COUNT * 3);
    const vx    = new Float32Array(FALL_COUNT);
    const vy    = new Float32Array(FALL_COUNT);
    const phase = new Float32Array(FALL_COUNT);
    for (let i = 0; i < FALL_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = -2 + Math.random() * 3;
      vx[i]    = (Math.random() - 0.5) * 0.4;
      vy[i]    = -(0.2 + Math.random() * 0.55);
      phase[i] = Math.random() * Math.PI * 2;
    }
    return { pos, vx, vy, phase };
  }, []);

  useFrame(({ clock }, dt) => {
    const arr = posRef.current?.array as Float32Array;
    if (!arr) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < FALL_COUNT; i++) {
      arr[i * 3]     += (vx[i] + Math.sin(t * 1.1 + phase[i]) * 0.08) * dt;
      arr[i * 3 + 1] += vy[i] * dt;
      if (arr[i * 3 + 1] < -6) {
        arr[i * 3]     = (Math.random() - 0.5) * 18;
        arr[i * 3 + 1] = 6;
      }
    }
    posRef.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute ref={posRef} attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.11} color="#e07018" sizeAttenuation depthWrite={false} transparent opacity={0.8} />
    </points>
  );
}

// ─── Main tree trunk (right side) ────────────────────────────────────────────
function MainTrunk() {
  return (
    <group position={[4.2, 3, 0.6]}>
      {/* Trunk */}
      <mesh>
        <cylinderGeometry args={[0.46, 0.60, 22, 8]} />
        <meshLambertMaterial color="#3a1205" />
      </mesh>
      {/* Bark variation - darker stripe on trunk */}
      <mesh rotation={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.42, 0.56, 22, 4]} />
        <meshLambertMaterial color="#2a0c02" transparent opacity={0.5} />
      </mesh>
      {/* A thick branch going left */}
      <mesh position={[-0.55, -1.5, 0.1]} rotation={[0.1, 0, -0.55]}>
        <cylinderGeometry args={[0.18, 0.28, 2.8, 7]} />
        <meshLambertMaterial color="#381005" />
      </mesh>
    </group>
  );
}

// ─── Hobbes (resting against tree) ───────────────────────────────────────────
function Hobbes() {
  const rootRef = useRef<THREE.Group>(null!);

  // gentle breathing
  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    rootRef.current.rotation.z = -0.15 + Math.sin(clock.elapsedTime * 0.7) * 0.016;
  });

  const orange = "#c84010";
  const stripe = "#3a0c00";
  const white  = "#f4efe5";
  const dark   = "#0c0400";

  return (
    <group ref={rootRef} position={[3.05, -1.55, 1.1]} rotation={[0.05, -0.25, -0.15]}>

      {/* Lower body */}
      <mesh position={[0, 0, 0]} scale={[1.05, 1.15, 0.88]}>
        <sphereGeometry args={[0.44, 14, 10]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.72, 0]} scale={[1.0, 1.35, 0.88]}>
        <sphereGeometry args={[0.41, 14, 10]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      {/* White belly */}
      <mesh position={[0.02, 0.42, 0.28]} scale={[0.72, 1.55, 0.40]}>
        <sphereGeometry args={[0.40, 10, 8]} />
        <meshLambertMaterial color={white} />
      </mesh>

      {/* Stripe rings */}
      {[0.0, 0.32, 0.62, 0.92].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} scale={[1, 0.11, 0.90]}>
          <torusGeometry args={[0.40, 0.065, 5, 18]} />
          <meshLambertMaterial color={stripe} />
        </mesh>
      ))}

      {/* Head */}
      <mesh position={[0, 1.52, 0.08]} scale={[1.02, 0.94, 0.90]}>
        <sphereGeometry args={[0.41, 14, 10]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      {/* White muzzle */}
      <mesh position={[0.02, 1.38, 0.30]} scale={[0.90, 0.74, 0.43]}>
        <sphereGeometry args={[0.36, 10, 8]} />
        <meshLambertMaterial color={white} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 1.33, 0.60]} scale={[1.35, 0.72, 0.58]}>
        <sphereGeometry args={[0.115, 8, 6]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      {/* Closed eyes — flat dark dashes */}
      <mesh position={[-0.17, 1.60, 0.54]} scale={[0.15, 0.024, 0.065]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      <mesh position={[ 0.19, 1.60, 0.52]} scale={[0.15, 0.024, 0.065]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      {/* Peaceful smile — squashed torus arc */}
      <mesh position={[0, 1.28, 0.61]} rotation={[1.45, 0, 0]}>
        <torusGeometry args={[0.11, 0.022, 4, 10, Math.PI * 0.68]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.28, 1.83, -0.08]}>
        <sphereGeometry args={[0.125, 7, 6]} />
        <meshLambertMaterial color="#260c00" />
      </mesh>
      <mesh position={[ 0.30, 1.85, -0.08]}>
        <sphereGeometry args={[0.115, 7, 6]} />
        <meshLambertMaterial color="#260c00" />
      </mesh>

      {/* Left arm — draped over Calvin */}
      <mesh position={[-0.46, 0.68, 0.20]} rotation={[-0.25, 0.20, 0.82]}>
        <cylinderGeometry args={[0.11, 0.145, 0.90, 7]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      <mesh position={[-0.95, 0.30, 0.35]} scale={[1.25, 0.88, 0.92]}>
        <sphereGeometry args={[0.17, 8, 7]} />
        <meshLambertMaterial color={white} />
      </mesh>

      {/* Right arm — resting at side against tree */}
      <mesh position={[0.46, 0.55, 0.08]} rotation={[0.18, -0.12, -0.35]}>
        <cylinderGeometry args={[0.11, 0.145, 0.82, 7]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      <mesh position={[0.76, 0.22, 0.14]} scale={[1.25, 0.88, 0.92]}>
        <sphereGeometry args={[0.16, 8, 7]} />
        <meshLambertMaterial color={white} />
      </mesh>

      {/* Left leg — extended forward/down */}
      <mesh position={[-0.22, -0.55, 0.32]} rotation={[0.85, 0, 0.12]}>
        <cylinderGeometry args={[0.145, 0.175, 0.88, 8]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      <mesh position={[-0.25, -0.85, 0.90]} scale={[1.35, 0.65, 1.65]}>
        <sphereGeometry args={[0.18, 8, 7]} />
        <meshLambertMaterial color={white} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.22, -0.58, 0.22]} rotation={[0.70, 0, -0.10]}>
        <cylinderGeometry args={[0.145, 0.175, 0.88, 8]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      <mesh position={[0.25, -0.88, 0.75]} scale={[1.35, 0.65, 1.65]}>
        <sphereGeometry args={[0.18, 8, 7]} />
        <meshLambertMaterial color={white} />
      </mesh>

      {/* Tail */}
      <mesh position={[-0.35, -0.22, -0.52]} rotation={[-0.35, 0.3, -0.55]}>
        <cylinderGeometry args={[0.07, 0.145, 0.88, 7]} />
        <meshLambertMaterial color={orange} />
      </mesh>
      <mesh position={[-0.65, -0.05, -0.92]}>
        <sphereGeometry args={[0.115, 7, 6]} />
        <meshLambertMaterial color={stripe} />
      </mesh>
    </group>
  );
}

// ─── Calvin (nestled against Hobbes) ─────────────────────────────────────────
function Calvin() {
  const rootRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    rootRef.current.rotation.z = 0.22 + Math.sin(clock.elapsedTime * 0.7 + 0.5) * 0.014;
  });

  const skin   = "#de9f5a";
  const red    = "#c81818";
  const dkred  = "#6c1010";
  const dark   = "#0c0400";
  const blonde = "#d4b828";
  const shorts = "#1a1830";

  return (
    <group ref={rootRef} position={[1.92, -2.18, 1.25]} rotation={[0.08, -0.18, 0.22]}>

      {/* Body */}
      <mesh position={[0, 0.24, 0]} scale={[1, 1.10, 0.90]}>
        <sphereGeometry args={[0.295, 12, 8]} />
        <meshLambertMaterial color={red} />
      </mesh>
      {[0.13, 0.32].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} scale={[1, 0.12, 0.88]}>
          <torusGeometry args={[0.28, 0.052, 4, 12]} />
          <meshLambertMaterial color={dkred} />
        </mesh>
      ))}

      {/* Shorts */}
      <mesh position={[0, -0.03, 0]} scale={[1, 0.52, 0.88]}>
        <sphereGeometry args={[0.275, 10, 7]} />
        <meshLambertMaterial color={shorts} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.74, 0]} scale={[1.0, 0.96, 0.92]}>
        <sphereGeometry args={[0.31, 14, 10]} />
        <meshLambertMaterial color={skin} />
      </mesh>

      {/* Closed eyes */}
      <mesh position={[-0.11, 0.80, 0.27]} scale={[0.13, 0.023, 0.062]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      <mesh position={[ 0.11, 0.80, 0.27]} scale={[0.13, 0.023, 0.062]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshLambertMaterial color={dark} />
      </mesh>

      {/* Smile */}
      <mesh position={[0, 0.67, 0.29]} rotation={[1.42, 0, 0]}>
        <torusGeometry args={[0.085, 0.018, 4, 8, Math.PI * 0.62]} />
        <meshLambertMaterial color={dark} />
      </mesh>

      {/* Rosy cheeks */}
      <mesh position={[0.19, 0.72, 0.25]} scale={[1, 0.58, 0.38]}>
        <sphereGeometry args={[0.075, 6, 5]} />
        <meshLambertMaterial color="#cc6840" transparent opacity={0.55} />
      </mesh>

      {/* Spiky blonde hair */}
      {[
        [-0.03, 1.05,  0.05,  0.07, -0.22],
        [ 0.13, 1.02,  0.07, -0.22, -0.13],
        [-0.16, 1.01,  0.05,  0.30, -0.05],
        [ 0.21, 1.01,  0.01, -0.40,  0.11],
        [ 0.05, 1.07, -0.07,  0.06, -0.50],
        [-0.22, 1.00, -0.03,  0.46,  0.08],
        [ 0.01, 1.04,  0.08, -0.10, -0.30],
      ].map(([x, y, z, rz, rx], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} rotation={[rx as number, 0, rz as number]}>
          <coneGeometry args={[0.062, 0.23, 5]} />
          <meshLambertMaterial color={blonde} />
        </mesh>
      ))}

      {/* Arms */}
      <mesh position={[-0.28, 0.28, 0.09]} rotation={[0.38, 0.18, -0.48]}>
        <cylinderGeometry args={[0.068, 0.078, 0.40, 6]} />
        <meshLambertMaterial color={skin} />
      </mesh>
      <mesh position={[0.27, 0.25, 0.07]} rotation={[0.28, -0.12, 0.40]}>
        <cylinderGeometry args={[0.068, 0.078, 0.40, 6]} />
        <meshLambertMaterial color={red} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.11, -0.30, 0.12]} rotation={[0.52, 0, -0.10]}>
        <cylinderGeometry args={[0.105, 0.095, 0.44, 7]} />
        <meshLambertMaterial color={shorts} />
      </mesh>
      <mesh position={[-0.13, -0.55, 0.30]} scale={[1.05, 0.58, 1.55]}>
        <sphereGeometry args={[0.122, 7, 6]} />
        <meshLambertMaterial color="#d8d4ce" />
      </mesh>
      <mesh position={[0.11, -0.32, 0.08]} rotation={[0.42, 0, 0.10]}>
        <cylinderGeometry args={[0.105, 0.095, 0.44, 7]} />
        <meshLambertMaterial color={shorts} />
      </mesh>
      <mesh position={[0.13, -0.56, 0.26]} scale={[1.05, 0.58, 1.55]}>
        <sphereGeometry args={[0.122, 7, 6]} />
        <meshLambertMaterial color="#d8d4ce" />
      </mesh>
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────
export function CalvinHobbesScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.5, 9], fov: 62 }}
      gl={{ antialias: true }}
      style={{ background: "#1a0800" }}
    >
      {/* Warm amber atmospheric fog */}
      <fogExp2 attach="fog" args={["#b86018", 0.052]} />

      {/* Sky & glow — barely moves */}
      <ParallaxLayer factor={0.04}>
        <AtmosphericSky />
      </ParallaxLayer>

      {/* Tree avenue */}
      <ParallaxLayer factor={0.18}>
        <TreeAvenue />
      </ParallaxLayer>

      {/* Ground leaf carpet */}
      <ParallaxLayer factor={0.52}>
        <GroundLeaves />
      </ParallaxLayer>

      {/* Characters + main trunk — warm directional light */}
      <ParallaxLayer factor={0.80}>
        {/* Key light from the glowing background */}
        <ambientLight intensity={0.45} color="#ffcc80" />
        <directionalLight position={[-2, 6, 8]} intensity={1.2} color="#ffb84a" />
        {/* Soft warm fill bouncing off leaves */}
        <directionalLight position={[6, -1, 4]} intensity={0.25} color="#e07820" />
        <MainTrunk />
        <Hobbes />
        <Calvin />
      </ParallaxLayer>

      {/* Falling leaves — most parallax */}
      <ParallaxLayer factor={1.20}>
        <FallingLeaves />
      </ParallaxLayer>

      <EffectComposer>
        <Bloom luminanceThreshold={0.45} intensity={2.0} mipmapBlur radius={0.80} />
      </EffectComposer>
    </Canvas>
  );
}
