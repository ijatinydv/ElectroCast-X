"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { BoxGeometry, Color, Matrix4, MeshBasicMaterial, Vector3 } from "three";
import type { Group, InstancedMesh } from "three";
import { buildVolume, VOLUME_DEPTH, VOLUME_HEIGHT, VOLUME_WIDTH } from "@/lib/derive/volume";
import type { Flash, Cell } from "@/types/scenario";
import type { XRayFeatureVisibility } from "@/components/xray/XRayControls";

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

// reads the semantic risk token used only for mixed-phase hail hazard
function riskColor(): Color {
  return new Color(getComputedStyle(document.documentElement).getPropertyValue("--color-risk").trim());
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
function VoxelCloud({ cell, sliceAltitudeKm, showMixedPhase }: { cell: Cell; sliceAltitudeKm: number; showMixedPhase: boolean }) {
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
    const mixedPhaseColor = riskColor();
    const darkest = new Color("black");
    const maxValue = Math.max(...voxels.map((voxel) => voxel.value), 1);
    const mixedPhaseBottomKm = cell.freezingLevelKm + 10 / 6.5;
    const mixedPhaseTopKm = cell.freezingLevelKm + 20 / 6.5;
    const mixedPhaseThreshold = Math.max(20, cell.reflectivityDbz * 0.62);

    voxels.forEach((voxel, index) => {
      matrix.makeTranslation((voxel.x - VOLUME_WIDTH / 2) * 0.18, (voxel.z - VOLUME_HEIGHT / 2) * 0.18, (voxel.y - VOLUME_DEPTH / 2) * 0.18);
      mesh.setMatrixAt(index, matrix);
      const voxelAltitudeKm = (voxel.z / (VOLUME_HEIGHT - 1)) * cell.echoTopKm;
      const sliceBrightness = Math.abs(voxelAltitudeKm - sliceAltitudeKm) <= 0.4 ? 0.35 : 0;
      const isMixedPhaseHazard = showMixedPhase && voxelAltitudeKm >= mixedPhaseBottomKm && voxelAltitudeKm <= mixedPhaseTopKm && voxel.value >= mixedPhaseThreshold;
      mesh.setColorAt(index, darkest.clone().lerp(isMixedPhaseHazard ? mixedPhaseColor : color, Math.min(1, voxel.value / maxValue + sliceBrightness)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    invalidate();
  }, [cell.echoTopKm, cell.freezingLevelKm, cell.reflectivityDbz, invalidate, showMixedPhase, sliceAltitudeKm, voxels]);

  React.useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return <instancedMesh ref={instances} args={[geometry, material, voxels.length]} frustumCulled={false} />;
}

// maps the prepared column category onto the corresponding thermodynamic altitude
function zdrColumnAltitude(cell: Cell): number | null {
  if (cell.zdrColumnLevel === "none") return null;
  if (cell.zdrColumnLevel === "0C") return cell.freezingLevelKm;
  if (cell.zdrColumnLevel === "-10C") return cell.freezingLevelKm + 10 / 6.5;
  return cell.freezingLevelKm + 20 / 6.5;
}

// marks the supercooled liquid column extending above the freezing level
function ZdrColumn({ cell }: { cell: Cell }) {
  const topAltitudeKm = zdrColumnAltitude(cell);
  if (topAltitudeKm === null || topAltitudeKm <= cell.freezingLevelKm) return null;
  const bottom = sceneHeightFor(cell.freezingLevelKm, cell.echoTopKm);
  const top = sceneHeightFor(topAltitudeKm, cell.echoTopKm);

  return (
    <mesh position={[-0.22, (bottom + top) / 2, 0.08]}>
      <cylinderGeometry args={[0.3, 0.3, top - bottom, 16, 1, true]} />
      <meshBasicMaterial color={observedColor()} depthWrite={false} opacity={0.32} side={2} transparent />
    </mesh>
  );
}

// shows the concentrated differential-phase signal at the strong mixed-phase level
function KdpCore({ cell }: { cell: Cell }) {
  const altitudeKm = cell.freezingLevelKm + 10 / 6.5;
  const radius = Math.min(0.62, Math.max(0.18, cell.kdpCore * 0.2));

  return (
    <mesh position={[0.32, sceneHeightFor(altitudeKm, cell.echoTopKm), -0.2]}>
      <icosahedronGeometry args={[radius, 2]} />
      <meshBasicMaterial color={observedColor()} depthWrite={false} opacity={0.6} transparent />
    </mesh>
  );
}

// keeps a few line geometries moving upward without triggering React renders
function UpdraftStreamlines({ cell, visible }: { cell: Cell; visible: boolean }) {
  const group = React.useRef<Group>(null);
  const streamlines = React.useMemo(() => [[-0.55, -0.28], [-0.18, 0.42], [0.2, -0.1], [0.54, 0.26]], []);
  const speed = Math.min(1.3, Math.max(0.28, cell.updraftMs / 18));

  useFrame((_, delta) => {
    if (!visible || !group.current) return;
    group.current.position.y = ((group.current.position.y + delta * speed + 1.2) % 2.4) - 1.2;
  });

  if (!visible) return null;
  return (
    <group ref={group}>
      {streamlines.map(([x, z], index) => (
        <Line color={observedColor()} key={`${x}-${z}`} lineWidth={1} points={[[x!, -0.8 + index * 0.08, z!], [x! + 0.07, -0.34 + index * 0.08 + 0.46 * speed, z! + 0.03], [x! - 0.03, 0.02 + index * 0.08 + 0.82 * speed, z! - 0.02]]} transparent opacity={0.7} />
      ))}
    </group>
  );
}

// projects a prepared geographic flash into the compact storm-centred scene
function flashPosition(flash: Flash, cell: Cell): Vector3 {
  const longitudeKm = (flash.lonLat[0] - cell.centroid[0]) * 104;
  const latitudeKm = (flash.lonLat[1] - cell.centroid[1]) * 111;
  const scale = 1.7 / Math.max(cell.radiusKm, 1);
  return new Vector3(longitudeKm * scale, sceneHeightFor(flash.altKm ?? cell.freezingLevelKm, cell.echoTopKm), -latitudeKm * scale);
}

// renders measured strikes solid and forecast strikes as lightweight hollow rings
function Flashes({ cell, flashes, predicted }: { cell: Cell; flashes: Flash[]; predicted: boolean }) {
  const insideCell = flashes.filter((flash) => {
    const longitudeKm = (flash.lonLat[0] - cell.centroid[0]) * 104;
    const latitudeKm = (flash.lonLat[1] - cell.centroid[1]) * 111;
    return Math.hypot(longitudeKm, latitudeKm) <= cell.radiusKm;
  }).slice(0, 16);
  const color = predicted ? forecastColor() : observedColor();

  return <>{insideCell.map((flash, index) => {
    const position = flashPosition(flash, cell);
    return predicted ? (
      <mesh key={`${flash.tMin}-${index}`} position={position} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.018, 6, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    ) : (
      <mesh key={`${flash.tMin}-${index}`} position={position}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  })}</>;
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
export function StormScene({ cell, features, flashes, predictedFlashes, sliceAltitudeKm }: { cell: Cell; features: XRayFeatureVisibility; flashes: Flash[]; predictedFlashes: boolean; sliceAltitudeKm: number }) {
  const [interacting, setInteracting] = React.useState(false);
  const [webglSupported] = React.useState(supportsWebGl);

  if (!webglSupported) {
    return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-fg-2" role="status">WebGL is unavailable in this browser, so the simulated reflectivity volume cannot render.</div>;
  }

  return (
    <Canvas
      aria-label={`Storm physical volume for ${cell.id}`}
      camera={{ position: [5.6, 4.2, 5.6], fov: 42 }}
      dpr={[1, 2]}
      frameloop="demand"
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor(getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim(), 1)}
    >
      <ambientLight intensity={0.35} />
      {features.reflectivity && <VoxelCloud cell={cell} showMixedPhase={features.mixedPhase} sliceAltitudeKm={sliceAltitudeKm} />}
      <TemperaturePlanes cell={cell} sliceAltitudeKm={sliceAltitudeKm} />
      {features.zdrColumn && <ZdrColumn cell={cell} />}
      {features.kdpCore && <KdpCore cell={cell} />}
      <UpdraftStreamlines cell={cell} visible={features.updraft} />
      {features.flashes && <Flashes cell={cell} flashes={flashes} predicted={predictedFlashes} />}
      <SceneControls onInteraction={() => setInteracting(true)} />
      <IdleRotation active={interacting} />
    </Canvas>
  );
}
