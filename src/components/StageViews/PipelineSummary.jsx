import React from 'react';

export default function PipelineSummary({ summary }) {
  if (!summary) return null;
  
  const metrics = [
    { label: "Raw ChEMBL", value: summary.raw_chembl_records },
    { label: "Parsed", value: summary.parsed_ligands },
    { label: "Unique", value: summary.unique_ligands },
    { label: "BRICS Frags", value: summary.brics_fragments > 0 ? summary.brics_fragments : "N/A" },
    { label: "Raw Generated", value: summary.raw_generated },
    { label: "Valid", value: summary.valid_candidates },
    { label: "Deduplicated", value: summary.deduplicated_candidates },
    { label: "Passed Props", value: summary.property_passed_candidates },
    { label: "Diverse", value: summary.diverse_candidates },
    { label: "Docked", value: summary.docked_candidates },
    { label: "Classical Top", value: summary.classical_top_candidates, highlight: true },
    { label: "Quantum Selected", value: summary.quantum_selected_candidates, quantum: true },
  ];

  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg mb-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        📊 Pipeline Data Accounting
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
        {metrics.map((m, idx) => (
          <div key={idx} className={`p-2 rounded-lg border ${m.quantum ? 'border-cyan-500/30 bg-cyan-900/10' : m.highlight ? 'border-teal-500/30 bg-teal-900/10' : 'border-slate-800 bg-slate-800/50'}`}>
            <div className={`text-[10px] font-bold uppercase mb-1 ${m.quantum ? 'text-cyan-500' : m.highlight ? 'text-teal-400' : 'text-slate-500'}`}>
              {m.label}
            </div>
            <div className={`font-mono text-lg ${m.quantum ? 'text-cyan-400 font-bold' : m.highlight ? 'text-quantovia-teal font-bold' : 'text-quantovia-off-white'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
