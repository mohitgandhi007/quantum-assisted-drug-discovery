import React from 'react';

export default function EmptyState() {
  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-8 shadow-xl flex flex-col justify-center items-center flex-1">
      {/* Visual Biotech Emblem */}
      <div className="h-20 w-20 bg-quantovia-deep-teal/10 border border-quantovia-deep-teal/30 rounded-full flex items-center justify-center text-quantovia-teal text-4xl mb-6 shadow-inner">
        ⬡
      </div>

      <h2 className="text-2xl font-bold text-quantovia-off-white tracking-tight">
        Discovery Pipeline Overview
      </h2>
      
      <p className="text-sm text-slate-400 mt-3 max-w-lg text-center leading-relaxed">
        This automated platform executes a complete *in silico* drug discovery pipeline targeting the Epidermal Growth Factor Receptor (EGFR). The process integrates generative chemistry (BRICS) with classical docking (AutoDock Vina) and prepares formulations for quantum optimization algorithms (QUBO/QAOA).
      </p>

      {/* Target Details Card */}
      <div className="w-full max-w-xl bg-slate-950/80 border border-quantovia-charcoal rounded-lg px-5 py-4 mt-8 text-left space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-quantovia-charcoal pb-2 mb-3">
          Pipeline Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs font-mono">
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">Target Protein</span>
            <span className="text-slate-300 font-bold">EGFR</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">PDB Structure</span>
            <span className="text-quantovia-teal font-bold">1M17</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">Generation</span>
            <span className="text-slate-300">BRICS Assembly</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">Docking</span>
            <span className="text-slate-300">AutoDock Vina</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded md:col-span-2">
            <span className="text-slate-500">Optimization Engine</span>
            <span className="text-quantovia-lime-sage">Qiskit QAOA Simulator</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-xs text-slate-500 font-mono text-center max-w-md">
        Click "Run Discovery Pipeline" on the left panel to initialize the screening process.
      </div>
    </div>
  );
}
