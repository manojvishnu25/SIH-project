import React from 'react';
import { Box, Upload, Play, Shield, Cpu, RefreshCw } from 'lucide-react';

export default function Header({ onOpenUpload, onLoadDemo, isProcessing, activeJobId }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20 relative">
      {/* Brand & Problem Statement Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Box className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AEROVISTA<span className="text-cyan-400 font-extrabold">-X</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">PROTOTYPE</span>
            </h1>
            <p className="text-xs text-slate-400">SIH26158 | Single-Pass Drone Video to 3D Digital Twin System</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-2 pl-6 border-l border-slate-800">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1.5 border border-slate-700">
            <Shield className="w-3.5 h-3.5 text-cyan-400" /> Team: The Sixth Syndicate
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onLoadDemo}
          disabled={isProcessing}
          className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-2 ${
            isProcessing
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30 shadow-md shadow-cyan-950/40'
          }`}
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> : <Play className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />}
          Load Demo Flight
        </button>

        <button
          onClick={onOpenUpload}
          disabled={isProcessing}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg ${
            isProcessing
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Video (.mp4)
        </button>
      </div>
    </header>
  );
}
