import React from 'react';

export default function DockingBadge({ dockingScore, bindingProxy, bindingMethod }) {
  // 1. Real Vina docking score available
  const hasDocking = typeof dockingScore === 'number' && dockingScore !== null;
  // 2. Similarity proxy fallback active
  const isProxy = !hasDocking && bindingMethod === 'similarity_proxy' && typeof bindingProxy === 'number' && bindingProxy !== null;

  if (hasDocking) {
    return (
      <div className="flex flex-col items-end sm:items-center">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 select-none">
          {dockingScore.toFixed(1)} kcal/mol
        </span>
        <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5 font-sans font-medium">
          Predicted Docking
        </span>
      </div>
    );
  }

  if (isProxy) {
    return (
      <div className="flex flex-col items-end sm:items-center">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 select-none">
          {bindingProxy.toFixed(2)}
        </span>
        <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5 font-sans font-medium" title="Tanimoto similarity proxy estimate against Erlotinib">
          Similarity-based estimate
        </span>
      </div>
    );
  }

  // 3. Pending or unavailable
  return (
    <div className="flex flex-col items-end sm:items-center">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-500 border border-slate-700/60 select-none">
        Pending
      </span>
      <span className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5 font-sans">
        Docking Simulation
      </span>
    </div>
  );
}
