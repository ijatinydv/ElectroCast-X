"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { BoxGeometry, Color, Matrix4, MeshBasicMaterial } from "three";
import type { InstancedMesh } from "three";
import { buildVolume, VOLUME_DEPTH, VOLUME_HEIGHT, VOLUME_WIDTH } from "@/lib/derive/volume";
import type { Cell } from "@/types/scenario";

// captures one thresholded sample for the small instanced volume renderer
type Voxel = { x: number; y: number; z: number; value: number };

// caps draw work to a laptop-safe count while retaining the strongest voxels
const MAX_VOXELS = 2800;

// aligns physical kilometres to the compact vertical extent of the voxel cloud
function sceneHeightFor(altitudeKm: number, echoTopKm: number): number {
  return Math.min(1.8, Math.max(-1.5, altitudeKm / Math.max(echoTopKm, 0.1) * (VOLUME_HEIGHT - 1) * 0.18 - VOLUME_HEIGHT / 2 * 0.18));
}

// reads the semantic observed token for the Three scene without duplicating a component colour
function observedColor(): Color {
  return new Color(getComputedStyle(document.documentElement).getPropertyValue("--color-observed").trim());
}

// reads the semantic forecast token for the operator-selected slice plane
function forecastColor(): Color {
  return new Color(getComputedStyle(document.documentElement).getPropertyValue("--color-forecast").trim());
}

// prevents the Three renderer from mounting in browsers that cannot supply any WebGL context
function supportsWebGl(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
}

// retains only the visible reflectivity samples while preserving their strongest values
function voxelsFor(cell: Cell): Voxel[] {
  const volume = buildVolume(cell);
  const threshold = Math.max(8, cell.reflectivityDbz * 0.22);
  const voxels: Voxel[] = [];

  for (let z = 0; z < VOLUME_HEIGHT; z += 1) {
    for (let y = 0; y < VOLUME_DEPTH; y += 1) {
      for (let x = 0; x < VOLUME_WIDTH; x += 1) {
        const value = volume[z * VOLUME_WIDTH * VOLUME_DEPTH + y * VOLUME_WIDTH + x]!;
        if (value >= threshold) voxels.push({ x, y, z, value });
      }
    }
  }

  return voxels.sort((left, right) => right.value - left.value).slice(0, MAX_VOXELS);
}

// updates fixed instance transforms and colours after each procedural volume change
function VoxelCloud({ cell, sliceAltitudeKm }: { cell: Cell; sliceAltitudeKm: number }) {
  const { invalidate } = useThree();
  const instances = React.useRef<InstancedMesh>(null);
  const voxels = React.useMemo(() => voxelsFor(cell), [cell]);
  const geometry = React.useMemo(() => new BoxGeometry(0.15, 0.15, 0.15), []);
  const material = React.useMemo(() => new MeshBasicMaterial({ transparent: true, opacity: 0.68, vertexColors: true, depthWrite: false }), []);

  React.useLayoutEffect(() => {
    const mesh = instances.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const color = observedColor();
    const darkest = new Color("black");
    const maxValue = Math.max(...voxels.map((voxel) => voxel.value), 1);

    voxels.forEach((voxel, index) => {
      matrix.makeTranslation((voxel.x - VOLUME_WIDTH / 2) * 0.18, (voxel.z - VOLUME_HEIGHT / 2) * 0.18, (voxel.y - VOLUME_DEPTH / 2) * 0.18);
      mesh.setMatrixAt(index, matrix);
      const voxelAltitudeKm = (voxel.z / (VOLUME_HEIGHT - 1)) * cell.echoTopKm;
      const sliceBrightness = Math.abs(voxelAltitudeKm - sliceAltitudeKm) <= 0.4 ? 0.35 : 0;
      mesh.setColorAt(index, darkest.clone().lerp(color, Math.min(1, voxel.value / maxValue + sliceBrightness)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    invalidate();
  }, [cell.echoTopKm, invalidate, sliceAltitudeKm, voxels]);

  React.useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return <instancedMesh ref={instances} args={[geometry, material, voxels.length]} frustumCulled={false} />;
}

// renders the three requested temperature references and the active horizontal inspection plane
function TemperaturePlanes({ cell, sliceAltitudeKm }: { cell: Cell; sliceAltitudeKm: number }) {
  const levels = [
    { altitudeKm: cell.freezingLevelKm, label: "0 °C" },
    { altitudeKm: cell.freezingLevelKm + 10 / 6.5, label: "−10 °C" },
    { altitudeKm: cell.freezingLevelKm + 20 / 6.5, label: "−20 °C" },
  ];
  const sliceHeight = sceneHeightFor(sliceAltitudeKm, cell.echoTopKm);

  return (
    <>
      {levels.map((level) => {
        const height = sceneHeightFor(level.altitudeKm, cell.echoTopKm);
        return (
          <group key={level.label} position={[0, height, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[4.8, 4.8]} />
              <meshBasicMaterial color="white" depthWrite={false} opacity={0.1} transparent />
            </mesh>
            <Html center distanceFactor={10} position={[2.55, 0, 0]} transform>
              <span className="num whitespace-nowrap rounded border border-line bg-bg px-1.5 py-1 text-[10px] text-fg-2">{level.label}</span>
            </Html>
          </group>
        );
      })}
      <mesh position={[0, sliceHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.9, 4.9]} />
        <meshBasicMaterial color={forecastColor()} depthWrite={false} opacity={0.26} transparent />
      </mesh>
    </>
  );
}

// invalidates demand rendering for orbit changes and disables idle rotation after interaction
function SceneControls({ onInteraction }: { onInteraction: () => void }) {
  const { invalidate } = useThree();

  return (
    <OrbitControls
      enablePan={false}
      enableDamping={false}
      maxDistance={9}
      maxPolarAngle={Math.PI * 0.78}
      minDistance={4.2}
      minPolarAngle={Math.PI * 0.2}
      onChange={() => invalidate()}
      onStart={onInteraction}
    />
  );
}

// advances the idle rotation only until an operator takes direct control of the scene
function IdleRotation({ active }: { active: boolean }) {
  const { invalidate, scene } = useThree();

  useFrame((_, delta) => {
    if (active) return;
    scene.rotation.y += delta * 0.12;
    invalidate();
  });

  return null;
}

// renders the compact on-demand R3F storm volume without affecting Mission Control's initial bundle
export function StormScene({ cell, sliceAltitudeKm }: { cell: Cell; sliceAltitudeKm: number }) {
  const [interacting, setInteracting] = React.useState(false);
  const [webglSupported] = React.useState(supportsWebGl);

  if (!webglSupported) {
    return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-fg-2" role="status">WebGL is unavailable in this browser, so the simulated reflectivity volume cannot render.</div>;
  }

  return (
    <Canvas
      aria-label={`Reflectivity volume for ${cell.id}`}
      camera={{ position: [5.6, 4.2, 5.6], fov: 42 }}
      dpr={[1, 2]}
      frameloop="demand"
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor(getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim(), 1)}
    >
      <ambientLight intensity={0.35} />
      <VoxelCloud cell={cell} sliceAltitudeKm={sliceAltitudeKm} />
      <TemperaturePlanes cell={cell} sliceAltitudeKm={sliceAltitudeKm} />
      <SceneControls onInteraction={() => setInteracting(true)} />
      <IdleRotation active={interacting} />
    </Canvas>
  );
}
