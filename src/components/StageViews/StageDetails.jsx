import React from 'react';

export default function StageDetails({ stage, candidates, quantum }) {
  if (!stage) return null;

  const renderDetails = () => {
    switch (stage.name) {
      case 'Target Validation':
        return (
          <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-1">PDB</span>
                <div className="text-quantovia-charcoal font-mono text-sm">{stage.details?.pdb}</div>
             </div>
             <div>
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-1">Input Ligands</span>
                <div className="text-quantovia-charcoal font-mono text-sm">{stage.details?.num_ligands} known binders</div>
             </div>
          </div>
        );
      case 'Molecular Generation':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-1">Method</span>
                <div className="text-quantovia-charcoal font-mono text-sm">{stage.details?.method}</div>
             </div>
             <div>
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-1">Raw Generated</span>
                <div className="text-quantovia-charcoal font-mono text-sm">{stage.details?.generated}</div>
             </div>
          </div>
        );
      case 'Molecular Properties':
        return (
          <div className="text-quantovia-charcoal text-sm">
             <p>{stage.details?.passed} candidates passed ADMET/QED and MW filters.</p>
          </div>
        );
      case 'Docking Simulation':
        return (
           <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-1">Successful (Vina)</span>
                <div className="text-quantovia-forest font-mono text-sm">{stage.details?.successful}</div>
             </div>
             <div>
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-1">Fallback (Tanimoto)</span>
                <div className="text-amber-600 font-mono text-sm">{stage.details?.fallback_used}</div>
             </div>
          </div>
        );
      case 'Classical Ranking':
        return (
           <div className="text-quantovia-charcoal text-sm">
             <p>Top {stage.details?.top_candidates} candidates ranked using multi-objective scoring:</p>
             <ul className="list-disc ml-5 mt-2 text-quantovia-sage font-mono text-xs">
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
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-2">QAOA Objective Value</span>
                <div className="text-quantovia-forest font-mono text-xl">{quantum?.objective_value?.toFixed(4) || 'N/A'}</div>
                <div className="text-[10px] text-quantovia-sage mt-1">Backend: {quantum?.backend}</div>
                <div className="text-[10px] text-rose-600 mt-1 italic">{quantum?.limitations}</div>
             </div>
             <div>
                <span className="block text-[10px] text-quantovia-sage font-bold uppercase mb-2">Selected Candidates</span>
                <div className="flex flex-wrap gap-2">
                   {quantum?.selected_candidates?.map(c => (
                      <span key={c} className="px-2 py-1 bg-surface-200 border border-surface-300 text-quantovia-charcoal rounded font-mono text-xs shadow-sm">✓ {c}</span>
                   ))}
                </div>
             </div>
           </div>
        );
      case 'AI Explanation':
         return (
            <div className="text-quantovia-charcoal text-sm">
              <p>Clinical explanations are generated based on true computational properties. <strong className="font-semibold text-quantovia-deep-teal">These findings represent purely computational hypotheses and require experimental validation.</strong></p>
            </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="bg-surface-100 border border-surface-300 rounded-xl p-6 shadow-sm mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4 border-b border-surface-300 pb-3">
         <h3 className="text-xs font-semibold text-quantovia-charcoal uppercase tracking-wider">
           Stage Detail: {stage.name}
         </h3>
         <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            stage.status === 'COMPLETED' ? 'bg-quantovia-teal/20 text-quantovia-forest border-quantovia-teal/40' :
            stage.status === 'COMPLETED_WITH_FALLBACK' ? 'bg-amber-100 text-amber-700 border-amber-200' :
            stage.status === 'FAILED' ? 'bg-rose-100 text-rose-700 border-rose-200' :
            'bg-surface-200 text-quantovia-sage border-surface-300'
         }`}>
           {stage.status}
         </span>
      </div>
      <div>
         <p className="text-sm text-quantovia-sage mb-4">{stage.message}</p>
         {renderDetails()}
      </div>
    </div>
  );
}
