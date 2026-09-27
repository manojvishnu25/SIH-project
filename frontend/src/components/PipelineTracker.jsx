import React, { useState } from 'react';
import { CheckCircle2, Clock, Terminal, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'EXTRACTING_KEYFRAMES', label: 'Keyframe Selection', desc: 'Laplacian Blur & Similarity Filter' },
  { key: 'ESTIMATING_POSES', label: 'SfM Camera Poses', desc: 'SIFT/ORB Keypoints & Triangulation' },
  { key: 'RECONSTRUCTING_3D', label: '3D Mesh Surface', desc: 'Poisson Reconstruction & Texturing' },
  { key: 'DETECTING_OBJECTS', label: 'YOLO Detection', desc: '3D Bounding Box Projection' },
  { key: 'MAPPING_CONFIDENCE', label: 'Confidence Heatmap', desc: 'Density & Reprojection Heuristics' },
];

export default function PipelineTracker({ job }) {
  const [showLogs, setShowLogs] = useState(false);

  if (!job) return null;

  const progress = job.progress || 0;
  const currentStep = job.status;
  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';

  const getStepState = (stepKey, index) => {
    if (isCompleted) return 'completed';
    if (isFailed) return 'failed';

    const stepOrder = PIPELINE_STEPS.map(s => s.key);
    const currentIndex = stepOrder.indexOf(currentStep);

    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 transition-all z-10 relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Step Indicators */}
        <div className="w-full md:w-auto flex items-center justify-between space-x-2 overflow-x-auto py-1 scrollbar-none">
          {PIPELINE_STEPS.map((step, idx) => {
            const state = getStepState(step.key, idx);
            return (
              <div key={step.key} className="flex items-center space-x-2 shrink-0">
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  state === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : state === 'active'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 animate-pulse'
                    : 'bg-slate-800/60 border-slate-800 text-slate-500'
                }`}>
                  {state === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : state === 'active' ? (
                    <Clock className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px]">
                      {idx + 1}
                    </div>
                  )}
                  <span>{step.label}</span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 rounded ${
                    state === 'completed' ? 'bg-emerald-500/40' : 'bg-slate-800'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar & Status Details */}
        <div className="w-full md:w-72 flex items-center space-x-3 shrink-0">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 font-semibold truncate max-w-[160px]">{job.current_step}</span>
              <span className="text-cyan-400 font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFailed
                    ? 'bg-red-500'
                    : isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs flex items-center gap-1 shrink-0"
            title="Toggle Pipeline Log Output"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Terminal Log Console */}
      {showLogs && (
        <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto space-y-1 shadow-inner">
          <div className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider border-b border-slate-900 pb-1 mb-1">
            AEROVISTA Pipeline Execution Log — Job #{job.id}
          </div>
          {(job.logs || []).map((log, i) => (
            <div key={i} className="text-slate-400 hover:text-slate-200">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
