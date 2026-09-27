import React from 'react';
import { MapPin, Compass, ShieldCheck, Activity, Database, Scale } from 'lucide-react';

export default function GISPanel({ job, modelMeta }) {
  if (!job) return null;

  const geo = modelMeta?.geo_origin || job.geo_metadata?.origin || {
    latitude: 28.6139,
    longitude: 77.2090,
    altitude_m: 120.5,
    scale_ratio: 1.0
  };

  const confSummary = job.geo_metadata?.confidence_summary || {
    high_confidence_pct: 78.4,
    medium_confidence_pct: 16.2,
    low_confidence_pct: 5.4,
    observed_points_count: 4250,
    ai_estimated_points_count: 750
  };

  return (
    <div className="absolute top-4 right-4 z-10 w-80 glass-panel rounded-2xl p-4 shadow-2xl border border-slate-800 text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">GIS Geo-Reference Metadata</h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
          WGS84 EPSG:4326
        </span>
      </div>

      {/* Geolocation Coordinates */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-400 font-mono">LATITUDE</span>
          <div className="font-mono font-bold text-slate-200 text-xs">{geo.latitude}° N</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-mono">LONGITUDE</span>
          <div className="font-mono font-bold text-slate-200 text-xs">{geo.longitude}° E</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-mono">ELEVATION (MSL)</span>
          <div className="font-mono font-bold text-slate-200 text-xs">{geo.altitude_m} m</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-mono">SCALE RATIO</span>
          <div className="font-mono font-bold text-cyan-400 text-xs">1 unit = {geo.scale_ratio} m</div>
        </div>
      </div>

      {/* Model Mesh Geometry Statistics */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Database className="w-3 h-3 text-indigo-400" /> Mesh Geometry Metrics
        </div>
        <div className="flex justify-between items-center bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <span className="text-slate-400">Total Keyframes Selected</span>
          <span className="font-mono font-bold text-white">{job.keyframes_selected} / {job.total_frames}</span>
        </div>
        <div className="flex justify-between items-center bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <span className="text-slate-400">Sparse Point Triangulation</span>
          <span className="font-mono font-bold text-white">{job.sparse_points_count.toLocaleString()} pts</span>
        </div>
        <div className="flex justify-between items-center bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <span className="text-slate-400">Dense Surface Faces</span>
          <span className="font-mono font-bold text-cyan-400">{job.dense_faces_count.toLocaleString()} faces</span>
        </div>
      </div>

      {/* Confidence Heuristic Summary */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" /> Confidence Distribution
          </div>
          <span className="text-xs font-mono font-extrabold text-emerald-400">
            {Math.round(job.avg_confidence * 100)}% AVG
          </span>
        </div>

        {/* Confidence Percentage Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden border border-slate-700/50">
          <div style={{ width: `${confSummary.high_confidence_pct}%` }} className="bg-emerald-500" title="High Confidence (>70%)" />
          <div style={{ width: `${confSummary.medium_confidence_pct}%` }} className="bg-amber-500" title="Medium Confidence (40-70%)" />
          <div style={{ width: `${confSummary.low_confidence_pct}%` }} className="bg-rose-500" title="Low Confidence (<40%)" />
        </div>

        <div className="grid grid-cols-3 text-[10px] font-mono text-center gap-1 pt-0.5">
          <div className="text-emerald-400 font-bold">{confSummary.high_confidence_pct}% High</div>
          <div className="text-amber-400 font-bold">{confSummary.medium_confidence_pct}% Med</div>
          <div className="text-rose-400 font-bold">{confSummary.low_confidence_pct}% Low</div>
        </div>

        {/* Photogrammetry vs AI Flag breakdown */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span>Observed (SfM): <strong className="text-emerald-400">{confSummary.observed_points_count}</strong></span>
          <span>AI Depth: <strong className="text-indigo-400">{confSummary.ai_estimated_points_count}</strong></span>
        </div>
      </div>
    </div>
  );
}
