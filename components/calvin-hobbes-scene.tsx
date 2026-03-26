"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

// const MODEL_URL =
//   ;

// useGLTF.preload(MODEL_URL);

function CalvinHobbesModel() {
  const { scene, animations } = useGLTF(
    "https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/calvin_and_hobbes.glb",
  );
  const { actions, names } = useAnimations(animations, scene);

  useEffect(() => {
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        (node as THREE.Mesh).frustumCulled = false;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (names.length === 0) return;
    names.forEach((name) => {
      actions[name]?.reset().fadeIn(0.3).play();
    });
    return () => {
      names.forEach((name) => actions[name]?.fadeOut(0.3));
    };
  }, [actions, names]);

  return <primitive object={scene} />;
}

export function CalvinHobbesScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1, 5], fov: 50 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <CalvinHobbesModel />
    </Canvas>
  );
}
