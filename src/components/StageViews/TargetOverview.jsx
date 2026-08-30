import React from 'react';

export default function TargetOverview({ target }) {
  if (!target) return null;
  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg mb-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        🎯 Target Overview
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Target</span>
          <div className="text-quantovia-off-white font-mono text-sm">{target.name}</div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">PDB Structure</span>
          <div className="text-quantovia-teal font-mono text-sm font-bold">{target.pdb}</div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Data Source</span>
          <div className="text-quantovia-off-white font-mono text-sm">{target.source}</div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Mode</span>
          <div className="text-quantovia-off-white font-mono text-xs leading-tight">{target.mode}</div>
        </div>
      </div>
    </div>
  );
}
