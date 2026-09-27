import React from 'react';
import {
  Layers, Eye, Camera, Box, Ruler, MoveHorizontal, ArrowUp, Maximize2, RotateCcw, Activity
} from 'lucide-react';

export default function Toolbar({
  viewMode,
  setViewMode,
  showTrajectory,
  setShowTrajectory,
  showObjects,
  setShowObjects,
  activeMeasureMode,
  setActiveMeasureMode,
  onResetMeasurement
}) {
  const viewModes = [
    { id: 'texture', label: 'Photorealistic Texture', icon: Layers },
    { id: 'confidence', label: 'Confidence Heatmap', icon: Activity },
    { id: 'wireframe', label: 'Wireframe Geometry', icon: Box },
    { id: 'pointcloud', label: '3D Point Cloud', icon: Eye }
  ];

  const measureModes = [
    { id: 'none', label: 'Select / Orbit Mode', icon: Eye },
    { id: 'distance', label: 'Distance (Meters)', icon: MoveHorizontal },
    { id: 'height', label: 'Structure Height (ΔZ)', icon: ArrowUp },
    { id: 'area', label: 'Planar Area (m²)', icon: Maximize2 }
  ];

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col space-y-3">
      {/* View Mode Switcher */}
      <div className="glass-panel rounded-xl p-1.5 flex flex-col space-y-1 shadow-2xl border border-slate-800">
        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-2.5 py-1 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-cyan-400" /> Rendering Mode
        </div>
        {viewModes.map(mode => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Layer Toggles (Camera Trajectory & 3D Objects) */}
      <div className="glass-panel rounded-xl p-1.5 flex flex-col space-y-1 shadow-2xl border border-slate-800">
        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-2.5 py-1 flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-cyan-400" /> Overlays
        </div>
        <button
          onClick={() => setShowTrajectory(!showTrajectory)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
            showTrajectory ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center space-x-2">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Drone Path Frustums</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${showTrajectory ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
        </button>

        <button
          onClick={() => setShowObjects(!showObjects)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
            showObjects ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300' : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center space-x-2">
            <Box className="w-3.5 h-3.5 text-indigo-400" />
            <span>3D Object Boxes</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${showObjects ? 'bg-indigo-400' : 'bg-slate-600'}`} />
        </button>
      </div>

      {/* Interactive 3D Measurement Tools */}
      <div className="glass-panel rounded-xl p-1.5 flex flex-col space-y-1 shadow-2xl border border-slate-800">
        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-2.5 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Ruler className="w-3 h-3 text-rose-400" /> 3D Measurement
          </span>
          <button
            onClick={onResetMeasurement}
            className="text-[9px] text-slate-500 hover:text-rose-400 flex items-center gap-0.5"
            title="Clear measurement points"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Clear
          </button>
        </div>
        {measureModes.map(m => {
          const Icon = m.icon;
          const isActive = activeMeasureMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMeasureMode(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 transition-all ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
