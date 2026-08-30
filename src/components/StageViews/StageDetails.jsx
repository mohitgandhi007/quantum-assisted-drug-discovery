import React from 'react';

export default function StageDetails({ stage, candidates, quantum }) {
  if (!stage) return null;

  const renderDetails = () => {
    switch (stage.name) {
      case 'Target Validation':
        return (
          <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">PDB</span>
                <div className="text-quantovia-teal font-mono text-sm">{stage.details?.pdb}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Input Ligands</span>
                <div className="text-quantovia-off-white font-mono text-sm">{stage.details?.num_ligands} known binders</div>
             </div>
          </div>
        );
      case 'Molecular Generation':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Method</span>
                <div className="text-quantovia-off-white font-mono text-sm">{stage.details?.method}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Raw Generated</span>
                <div className="text-quantovia-off-white font-mono text-sm">{stage.details?.generated}</div>
             </div>
          </div>
        );
      case 'Molecular Properties':
        return (
          <div className="text-slate-300 text-sm">
             <p>{stage.details?.passed} candidates passed ADMET/QED and MW filters.</p>
          </div>
        );
      case 'Docking Simulation':
        return (
           <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Successful (Vina)</span>
                <div className="text-quantovia-teal font-mono text-sm">{stage.details?.successful}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Fallback (Tanimoto)</span>
                <div className="text-amber-400 font-mono text-sm">{stage.details?.fallback_used}</div>
             </div>
          </div>
        );
      case 'Classical Ranking':
        return (
           <div className="text-slate-300 text-sm">
             <p>Top {stage.details?.top_candidates} candidates ranked using multi-objective scoring:</p>
             <ul className="list-disc ml-5 mt-2 text-slate-400 font-mono text-xs">
                <li>QED (30%)</li>
                <li>ESOL (20%)</li>
                <li>Docking Affinity (40%)</li>
                <li>PAINS Penalty (-10%)</li>
             </ul>
           </div>
        );
      case 'Quantum Optimization':
        return (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-2">QAOA Objective Value</span>
                <div className="text-cyan-400 font-mono text-xl">{quantum?.objective_value?.toFixed(4) || 'N/A'}</div>
                <div className="text-[10px] text-slate-500 mt-1">Backend: {quantum?.backend}</div>
                <div className="text-[10px] text-rose-400 mt-1 italic">{quantum?.limitations}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-2">Selected Candidates</span>
                <div className="flex flex-wrap gap-2">
                   {quantum?.selected_candidates?.map(c => (
                      <span key={c} className="px-2 py-1 bg-cyan-900/30 border border-cyan-700/50 text-cyan-300 rounded font-mono text-xs">✓ {c}</span>
                   ))}
                </div>
             </div>
           </div>
        );
      case 'AI Explanation':
         return (
            <div className="text-slate-300 text-sm">
              <p>Clinical explanations are generated based on true computational properties. <strong>These findings represent purely computational hypotheses and require experimental validation.</strong></p>
            </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4 border-b border-quantovia-charcoal pb-2">
         <h3 className="text-xs font-semibold text-quantovia-teal uppercase tracking-wider">
           Stage Detail: {stage.name}
         </h3>
         <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            stage.status === 'COMPLETED' ? 'bg-quantovia-teal/10 text-quantovia-teal border-quantovia-teal/30' :
            stage.status === 'COMPLETED_WITH_FALLBACK' ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' :
            stage.status === 'FAILED' ? 'bg-rose-400/10 text-rose-400 border-rose-400/30' :
            'bg-slate-700/30 text-slate-400 border-slate-600/30'
         }`}>
           {stage.status}
         </span>
      </div>
      <div>
         <p className="text-xs text-slate-400 mb-4">{stage.message}</p>
         {renderDetails()}
      </div>
    </div>
  );
}
