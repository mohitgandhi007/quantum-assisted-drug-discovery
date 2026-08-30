import React from 'react';

export default function EmptyState({ onStartDiscovery, isRunning }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl mx-auto shadow-xl text-center my-6 flex flex-col items-center">
      {/* Visual Biotech Emblem */}
      <div className="h-16 w-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 text-3xl mb-5 animate-pulse shadow-inner">
        🧬
      </div>

      <h2 className="text-xl font-bold text-slate-100 tracking-tight">
        EGFR Receptor Lead Optimization
      </h2>
      
      <p className="text-sm text-slate-400 mt-2 max-w-md">
        This automated pipeline screens molecular candidates against the Epidermal Growth Factor Receptor (EGFR) active site (PDB ID: 1M17) using generative chemistry and quantum affinity selection.
      </p>

      {/* Target Details Card */}
      <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg px-4 py-3 mt-6 text-left space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Target Specifications:
        </h3>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs font-mono">
          <div className="text-slate-500">Protein Name:</div>
          <div className="text-slate-300 text-right">ErbB-1 / EGFR Receptor</div>
          <div className="text-slate-500">PDB ID:</div>
          <div className="text-slate-300 text-right text-cyan-400 font-bold">1M17</div>
          <div className="text-slate-500">Discovery Engine:</div>
          <div className="text-slate-300 text-right">RDKit &amp; Qiskit-Affinity</div>
          <div className="text-slate-500">FastAPI Status:</div>
          <div className="text-slate-300 text-right text-emerald-400">Ready</div>
        </div>
      </div>

      {/* Control Button */}
      <div className="mt-8 w-full max-w-xs">
        <button
          onClick={onStartDiscovery}
          disabled={isRunning}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-sm shadow-md transition-all duration-300 transform active:scale-98 ${
            isRunning
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 cursor-pointer font-bold'
          }`}
        >
          {isRunning ? 'Processing Discovery...' : 'Start Discovery Pipeline'}
        </button>
      </div>
    </div>
  );
}
