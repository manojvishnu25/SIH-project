import React, { useState } from 'react';
import { Upload, X, FileVideo, AlertCircle } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
        setError('Please select a valid drone video file (.mp4, .mov)');
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) {
      onUpload(selectedFile);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg glass-panel-glow rounded-3xl p-6 shadow-2xl border border-slate-700 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Upload Drone Video</h2>
            <p className="text-xs text-slate-400">SIH26158 Single-Pass 3D Digital Twin Pipeline</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl p-8 text-center bg-slate-900/50 transition-all cursor-pointer relative">
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <FileVideo className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Drag & drop drone flight video here, or click to browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports MP4, MOV up to 4K resolution (30-90 sec recommended)</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile}
              className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-lg transition-all ${
                selectedFile
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Start 3D Reconstruction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
