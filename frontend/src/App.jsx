import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Header from './components/Header';
import PipelineTracker from './components/PipelineTracker';
import ThreeCanvas from './components/ThreeCanvas';
import Toolbar from './components/Toolbar';
import GISPanel from './components/GISPanel';
import ObjectInspector from './components/ObjectInspector';
import UploadModal from './components/UploadModal';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [activeJob, setActiveJob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraPoses, setCameraPoses] = useState([]);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [modelMeta, setModelMeta] = useState(null);

  // UI Interactive Controls State
  const [viewMode, setViewMode] = useState('texture'); // texture | confidence | wireframe | pointcloud
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showObjects, setShowObjects] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  
  // 3D Measurement State
  const [activeMeasureMode, setActiveMeasureMode] = useState('none'); // none | distance | height | area
  const [measurePoints, setMeasurePoints] = useState([]);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Load initial demo flight on mount
  useEffect(() => {
    handleLoadDemo();
  }, []);

  // Poll job status while processing
  useEffect(() => {
    if (!activeJob?.id || activeJob.status === 'COMPLETED' || activeJob.status === 'FAILED') {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/jobs/${activeJob.id}/status`);
        setActiveJob(res.data);

        if (res.data.status === 'COMPLETED') {
          fetchJobArtifacts(activeJob.id);
          setIsProcessing(false);
        } else if (res.data.status === 'FAILED') {
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  const fetchJobArtifacts = async (jobId) => {
    try {
      const [posesRes, objectsRes, modelRes] = await Promise.all([
        axios.get(`${API_BASE}/jobs/${jobId}/poses`),
        axios.get(`${API_BASE}/jobs/${jobId}/objects`),
        axios.get(`${API_BASE}/jobs/${jobId}/model`)
      ]);
      setCameraPoses(posesRes.data || []);
      setDetectedObjects(objectsRes.data || []);
      setModelMeta(modelRes.data || null);
    } catch (err) {
      console.error('Error fetching job artifacts:', err);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setIsProcessing(true);
      const res = await axios.post(`${API_BASE}/jobs/demo`);
      setActiveJob(res.data);
    } catch (err) {
      console.error('Error triggering demo job:', err);
      // Fallback synthetic state for offline standalone view
      const demoId = 'demo_offline';
      setActiveJob({
        id: demoId,
        filename: 'sample_drone_flight.mp4',
        status: 'COMPLETED',
        progress: 100.0,
        current_step: 'Demo Digital Twin Ready',
        keyframes_selected: 12,
        total_frames: 180,
        sparse_points_count: 5200,
        dense_faces_count: 14800,
        avg_confidence: 0.88,
        geo_metadata: {
          origin: { latitude: 28.6139, longitude: 77.2090, altitude_m: 120.5, scale_ratio: 1.0 },
          confidence_summary: {
            high_confidence_pct: 78.4, medium_confidence_pct: 16.2, low_confidence_pct: 5.4,
            observed_points_count: 4250, ai_estimated_points_count: 750
          }
        },
        logs: ['[INFO] Offline Standalone 3D Engine Initialized']
      });

      setCameraPoses(Array.from({ length: 12 }).map((_, i) => ({
        frame_index: i,
        translation: [12 * Math.cos((2 * Math.PI * i) / 12), 12 * Math.sin((2 * Math.PI * i) / 12), 8.0]
      })));

      setDetectedObjects([
        {
          id: 1, label: 'Building (Main Twin)', confidence: 0.96,
          bbox_3d: { center: [0, 2.5, 0], size: [8, 5, 8] }, color_hex: '#3b82f6',
          geo_location: { lat: 28.61395, lon: 77.20905 }
        },
        {
          id: 2, label: 'Vehicle (Surveillance)', confidence: 0.89,
          bbox_3d: { center: [6, 0.6, 2], size: [2, 1.2, 4] }, color_hex: '#ef4444',
          geo_location: { lat: 28.61388, lon: 77.20912 }
        },
        {
          id: 3, label: 'Vegetation Canopy', confidence: 0.92,
          bbox_3d: { center: [-5.5, 2.0, 0], size: [3.5, 4.0, 3.5] }, color_hex: '#10b981',
          geo_location: { lat: 28.61402, lon: 77.20892 }
        }
      ]);

      setIsProcessing(false);
    }
  };

  const handleUploadVideo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setIsProcessing(true);
      const res = await axios.post(`${API_BASE}/jobs/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActiveJob(res.data);
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Upload failed. Ensure backend server is running on localhost:8000.');
      setIsProcessing(false);
    }
  };

  const handleResetMeasurement = () => {
    setMeasurePoints([]);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadDemo={handleLoadDemo}
        isProcessing={isProcessing}
        activeJobId={activeJob?.id}
      />

      {/* Pipeline Progress & Status Tracker */}
      <PipelineTracker job={activeJob} />

      {/* Main 3D Dashboard Viewport */}
      <div className="flex-1 relative overflow-hidden">
        <ThreeCanvas
          viewMode={viewMode}
          showTrajectory={showTrajectory}
          showObjects={showObjects}
          cameraPoses={cameraPoses}
          detectedObjects={detectedObjects}
          activeMeasureMode={activeMeasureMode}
          measurePoints={measurePoints}
          setMeasurePoints={setMeasurePoints}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          confidenceSummary={activeJob?.geo_metadata?.confidence_summary}
        />

        {/* Floating View & Measurement Toolbar */}
        <Toolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          showTrajectory={showTrajectory}
          setShowTrajectory={setShowTrajectory}
          showObjects={showObjects}
          setShowObjects={setShowObjects}
          activeMeasureMode={activeMeasureMode}
          setActiveMeasureMode={setActiveMeasureMode}
          onResetMeasurement={handleResetMeasurement}
        />

        {/* GIS Metadata & Mesh Statistics Panel */}
        <GISPanel job={activeJob} modelMeta={modelMeta} />

        {/* 3D Detected Objects Sidebar */}
        <ObjectInspector
          objects={detectedObjects}
          selectedObject={selectedObject}
          onSelectObject={setSelectedObject}
        />
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadVideo}
      />
    </div>
  );
}
