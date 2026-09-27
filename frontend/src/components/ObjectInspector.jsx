import React from 'react';
import { Box, Target, MapPin, Eye, CheckCircle } from 'lucide-react';

export default function ObjectInspector({ objects, selectedObject, onSelectObject }) {
  if (!objects || objects.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 w-80 glass-panel rounded-2xl p-4 shadow-2xl border border-slate-800 text-xs max-h-72 flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 shrink-0">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Detected 3D Objects ({objects.length})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">YOLOv8 + 3D Ray</span>
      </div>

      {/* Object Cards List */}
      <div className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-thin">
        {objects.map(obj => {
          const isSelected = selectedObject?.id === obj.id;
          const [dx, dy, dz] = obj.bbox_3d.size;
          const volume = (dx * dy * dz).toFixed(1);

          return (
            <div
              key={obj.id}
              onClick={() => onSelectObject(obj)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                isSelected
                  ? 'bg-blue-600/20 border-cyan-400 text-white shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: obj.color_hex || '#3b82f6' }}
                  />
                  <span className="font-bold text-xs truncate max-w-[150px]">{obj.label}</span>
                </div>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  {Math.round(obj.confidence * 100)}% Match
                </span>
              </div>

              {/* Volume & Geolocation Metrics */}
              <div className="grid grid-cols-2 text-[10px] font-mono text-slate-400 pt-0.5 border-t border-slate-800/60">
                <div>
                  Volume: <strong className="text-slate-200">{volume} m³</strong>
                </div>
                <div>
                  Extent: <strong className="text-slate-200">{dx}×{dy}×{dz}m</strong>
                </div>
              </div>

              {obj.geo_location && (
                <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                  <span>Lat: {obj.geo_location.lat}, Lon: {obj.geo_location.lon}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
