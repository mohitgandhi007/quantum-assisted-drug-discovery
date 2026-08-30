import React from 'react';

export default function PipelineSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg mb-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        📊 Pipeline Summary
      </h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-center divide-x divide-quantovia-charcoal">
        <div className="px-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Input Ligands</div>
          <div className="text-quantovia-off-white font-mono text-lg">{summary.input_ligands}</div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Generated</div>
          <div className="text-quantovia-off-white font-mono text-lg">{summary.generated}</div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Valid</div>
          <div className="text-quantovia-off-white font-mono text-lg">{summary.valid}</div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Diverse</div>
          <div className="text-quantovia-off-white font-mono text-lg">{summary.diverse}</div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Passed Props</div>
          <div className="text-quantovia-off-white font-mono text-lg">{summary.property_passed}</div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Docked</div>
          <div className="text-quantovia-off-white font-mono text-lg">{summary.docked}</div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Classical Top</div>
          <div className="text-quantovia-teal font-mono text-lg font-bold">{summary.classical_top}</div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-cyan-500 font-bold uppercase mb-1">Quantum</div>
          <div className="text-cyan-400 font-mono text-lg font-bold">{summary.quantum_selected}</div>
        </div>
      </div>
    </div>
  );
}
