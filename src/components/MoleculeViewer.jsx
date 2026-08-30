import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';

export default function MoleculeViewer({ pdbId = "1M17" }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    setLoading(true);
    setError(null);
    
    let viewer = viewerRef.current;
    
    // If the viewer has not been initialized yet, create it.
    if (!viewer) {
      try {
        viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#020617' // slate-950
        });
        viewerRef.current = viewer;
      } catch (err) {
        console.error("Failed to initialize 3Dmol.js viewer:", err);
        setError("WebGL initialization failed. Make sure hardware acceleration is enabled.");
        setLoading(false);
        return;
      }
    }

    // Reset the viewer context
    viewer.clear();

    const targetUrl = pdbId.startsWith('pdb:') ? pdbId : `pdb:${pdbId}`;
    
    // Load structure via 3Dmol's built-in download tool
    $3Dmol.download(targetUrl, viewer, {
      multimodel: true,
      frames: true
    }, () => {
      try {
        // Apply scientific style (cartoon representation colored by spectrum)
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        viewer.zoomTo();
        viewer.render();
        setLoading(false);
      } catch (styleErr) {
        console.error("Error styling structure:", styleErr);
        setError("Error rendering structure style.");
        setLoading(false);
      }
    }, (downloadErr) => {
      console.error("Error downloading PDB from RCSB:", downloadErr);
      setError(`Failed to retrieve structure '${pdbId}' from RCSB PDB database.`);
      setLoading(false);
    });

    // Resize listener
    const resizeObserver = new ResizeObserver(() => {
      if (viewer) {
        viewer.resize();
        viewer.render();
      }
    });
    
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [pdbId]);

  // Visual helper functions
  const handleToggleSpin = () => {
    if (viewerRef.current) {
      const isSpinning = viewerRef.current.getSpin && viewerRef.current.getSpin();
      if (isSpinning) {
        viewerRef.current.spin(false);
      } else {
        viewerRef.current.spin(true);
      }
    }
  };

  const handleRecenter = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            3D Molecular Visualization
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active structure: <span className="font-mono text-cyan-400 font-bold">{pdbId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRecenter}
            disabled={loading || error}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] font-medium text-slate-300 rounded border border-slate-700 transition"
            title="Recenter Camera"
          >
            Recenter
          </button>
          <button
            onClick={handleToggleSpin}
            disabled={loading || error}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] font-medium text-slate-300 rounded border border-slate-700 transition"
            title="Toggle Spin"
          >
            Spin
          </button>
        </div>
      </div>

      {/* Render Area */}
      <div className="relative flex-1 min-h-[300px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
            <svg className="animate-spin h-8 w-8 text-cyan-400 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-slate-400 font-mono">Loading pdb:{pdbId} from RCSB...</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-10">
            <span className="text-rose-400 text-2xl mb-2">⚠</span>
            <p className="text-sm font-semibold text-slate-300">Visualization Unavailable</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[250px]">{error}</p>
          </div>
        )}

        {/* 3Dmol Target Container */}
        <div 
          ref={containerRef} 
          className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" 
        />
      </div>

      <div className="mt-2 text-[10px] text-slate-500 leading-normal flex items-start gap-1">
        <span>💡</span>
        <span>Drag mouse to rotate, scroll to zoom, right-click/ctrl-drag to translate.</span>
      </div>
    </div>
  );
}
