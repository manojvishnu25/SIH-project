import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- 3D Digital Twin Building & Terrain Component ---
function DigitalTwinModel({ viewMode, confidenceSummary }) {
  const meshRef = useRef();

  // Color selection based on view mode
  const isConfidence = viewMode === 'confidence';
  const isWireframe = viewMode === 'wireframe';
  const isPointCloud = viewMode === 'pointcloud';

  return (
    <group position={[0, 0, 0]}>
      {/* Ground Terrain Base */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[24, 0.2, 24]} />
        <meshStandardMaterial
          color={isConfidence ? '#166534' : '#334155'}
          wireframe={isWireframe}
          roughness={0.8}
        />
      </mesh>

      {/* Main Structure Body */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow ref={meshRef}>
        <boxGeometry args={[8, 5, 8]} />
        <meshStandardMaterial
          color={isConfidence ? '#22c55e' : '#94a3b8'}
          wireframe={isWireframe}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Terracotta Roof Cone */}
      <mesh position={[0, 6.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[5.8, 2.2, 4]} />
        <meshStandardMaterial
          color={isConfidence ? '#eab308' : '#b45309'}
          wireframe={isWireframe}
          roughness={0.6}
        />
      </mesh>

      {/* Solar Panel Array on Roof */}
      <mesh position={[1.5, 5.2, 1.5]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[3, 0.1, 2]} />
        <meshStandardMaterial color={isConfidence ? '#22c55e' : '#1e3a8a'} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* West Wing Facility Extension */}
      <mesh position={[-5.5, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 3, 6]} />
        <meshStandardMaterial color={isConfidence ? '#ef4444' : '#64748b'} wireframe={isWireframe} />
      </mesh>

      {/* Courtyard Parking Base */}
      <mesh position={[6, 0.01, 2]} receiveShadow>
        <planeGeometry args={[6, 8]} />
        <meshStandardMaterial color={isConfidence ? '#15803d' : '#475569'} rotation={[-Math.PI / 2, 0, 0]} />
      </mesh>

      {/* Simulated High-Density Point Cloud Overlay */}
      {isPointCloud && (
        <points position={[0, 2.5, 0]}>
          <boxGeometry args={[8.2, 5.2, 8.2]} />
          <pointsMaterial size={0.08} color="#38bdf8" />
        </points>
      )}
    </group>
  );
}

// --- Drone Camera Trajectory & Frustum Markers ---
function CameraTrajectory({ poses, visible }) {
  if (!visible || !poses || poses.length === 0) return null;

  const points = poses.map(p => new THREE.Vector3(...p.translation));

  return (
    <group>
      {/* Flight Path Polyline */}
      <Line points={points} color="#06b6d4" lineWidth={2.5} dashed={false} />

      {/* Camera Frustum Markers */}
      {poses.map((pose, idx) => (
        <group key={idx} position={pose.translation}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <coneGeometry args={[0.3, 0.6, 4]} />
            <meshBasicMaterial color="#38bdf8" wireframe />
          </mesh>
          <Html distanceFactor={20}>
            <div className="bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30 whitespace-nowrap shadow">
              CAM #{idx + 1}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// --- Detected 3D Object Bounding Boxes & Labels ---
function ObjectBoundingBoxes({ objects, visible, onSelectObject, selectedObjectId }) {
  if (!visible || !objects) return null;

  return (
    <group>
      {objects.map(obj => {
        const center = obj.bbox_3d.center;
        const size = obj.bbox_3d.size;
        const isSelected = selectedObjectId === obj.id;

        return (
          <group key={obj.id} position={center}>
            {/* 3D Wireframe Bounding Box */}
            <mesh onClick={(e) => { e.stopPropagation(); onSelectObject(obj); }}>
              <boxGeometry args={size} />
              <meshBasicMaterial
                color={isSelected ? '#38bdf8' : obj.color_hex || '#3b82f6'}
                wireframe
              />
            </mesh>

            {/* Hover / Click Label Overlay */}
            <Html distanceFactor={15} position={[0, size[2] / 2 + 0.5, 0]}>
              <div
                onClick={(e) => { e.stopPropagation(); onSelectObject(obj); }}
                className={`cursor-pointer px-2 py-1 rounded-md text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-1.5 border transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-white scale-110'
                    : 'bg-slate-900/90 text-white border-slate-700 hover:border-cyan-400'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: obj.color_hex || '#3b82f6' }}
                />
                <span>{obj.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({Math.round(obj.confidence * 100)}%)</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// --- Interactive 3D Measurement Tool Manager ---
function InteractiveMeasurementTool({ activeMode, points, setPoints }) {
  const { raycaster, mouse, camera, scene } = useThree();

  const handleCanvasClick = (e) => {
    if (!activeMode || activeMode === 'none') return;

    // Intersect scene objects
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const p = intersects[0].point;
      const newPt = [roundVal(p.x), roundVal(p.y), roundVal(p.z)];

      if (activeMode === 'distance' || activeMode === 'height') {
        if (points.length >= 2) {
          setPoints([newPt]);
        } else {
          setPoints([...points, newPt]);
        }
      } else if (activeMode === 'area') {
        setPoints([...points, newPt]);
      }
    }
  };

  const roundVal = (v) => Math.round(v * 100) / 100;

  // Calculate Distance (Meters)
  const calculateDistance = () => {
    if (points.length < 2) return 0;
    const [p1, p2] = points;
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2);
  };

  // Calculate Height (Meters)
  const calculateHeight = () => {
    if (points.length < 2) return 0;
    const [p1, p2] = points;
    return Math.abs(p1[1] - p2[1]).toFixed(2);
  };

  // Calculate Area (Sq Meters)
  const calculateArea = () => {
    if (points.length < 3) return 0;
    // Approximate planar area using polygon cross-product
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i][0] * points[j][2];
      area -= points[j][0] * points[i][2];
    }
    return (Math.abs(area) / 2.0).toFixed(2);
  };

  return (
    <group onClick={handleCanvasClick}>
      {/* Clicked 3D Point Markers */}
      {points.map((pt, idx) => (
        <group key={idx} position={pt}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
          <Html distanceFactor={12}>
            <div className="bg-rose-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
              P{idx + 1}
            </div>
          </Html>
        </group>
      ))}

      {/* Connecting Polyline */}
      {points.length >= 2 && (
        <Line
          points={points.map(p => new THREE.Vector3(...p))}
          color="#f43f5e"
          lineWidth={3}
        />
      )}

      {/* Measurement Result Overlay */}
      {points.length >= 2 && (
        <Html position={points[points.length - 1]} distanceFactor={12}>
          <div className="bg-slate-950/95 text-rose-300 border border-rose-500/40 p-2 rounded-lg shadow-xl font-mono text-xs whitespace-nowrap mt-4">
            <div className="font-bold text-rose-400 uppercase text-[10px] tracking-wider border-b border-rose-500/20 pb-0.5 mb-1">
              3D Measurement Result
            </div>
            {activeMode === 'distance' && <div>Distance: <span className="text-white font-bold">{calculateDistance()} m</span></div>}
            {activeMode === 'height' && <div>Height ($\Delta Z$): <span className="text-white font-bold">{calculateHeight()} m</span></div>}
            {activeMode === 'area' && <div>Planar Area: <span className="text-white font-bold">{calculateArea()} $m^2$</span></div>}
          </div>
        </Html>
      )}
    </group>
  );
}

// --- Main Canvas Parent Component ---
export default function ThreeCanvas({
  viewMode,
  showTrajectory,
  showObjects,
  cameraPoses,
  detectedObjects,
  activeMeasureMode,
  measurePoints,
  setMeasurePoints,
  selectedObject,
  setSelectedObject,
  confidenceSummary
}) {
  return (
    <div className="w-full h-full relative bg-slate-950 cursor-crosshair">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={45} />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} minDistance={5} maxDistance={50} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[20, 30, 15]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.4} />

        {/* Grid Floor Reference */}
        <gridHelper args={[40, 40, '#334155', '#1e293b']} position={[0, -0.2, 0]} />

        {/* 3D Scene Assets */}
        <DigitalTwinModel viewMode={viewMode} confidenceSummary={confidenceSummary} />
        <CameraTrajectory poses={cameraPoses} visible={showTrajectory} />
        <ObjectBoundingBoxes
          objects={detectedObjects}
          visible={showObjects}
          onSelectObject={setSelectedObject}
          selectedObjectId={selectedObject?.id}
        />
        <InteractiveMeasurementTool
          activeMode={activeMeasureMode}
          points={measurePoints}
          setPoints={setMeasurePoints}
        />
      </Canvas>
    </div>
  );
}
