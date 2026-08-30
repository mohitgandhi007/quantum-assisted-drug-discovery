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
    <div className="bg-surface-100 border border-surface-300 rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-sm font-semibold text-quantovia-sage uppercase tracking-wider mb-4 flex items-center gap-2">
        📊 Pipeline Data Accounting
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
        {metrics.map((m, idx) => (
          <div key={idx} className={`p-3 rounded-xl border ${m.quantum ? 'border-quantovia-teal/40 bg-quantovia-teal/10 shadow-sm' : m.highlight ? 'border-quantovia-teal/40 bg-quantovia-teal/10 shadow-sm' : 'border-surface-300 bg-surface-200'}`}>
            <div className={`text-[10px] font-bold uppercase mb-1 ${m.quantum ? 'text-quantovia-forest' : m.highlight ? 'text-quantovia-forest' : 'text-quantovia-sage'}`}>
              {m.label}
            </div>
            <div className={`font-mono text-xl ${m.quantum ? 'text-quantovia-charcoal font-bold' : m.highlight ? 'text-quantovia-charcoal font-bold' : 'text-quantovia-charcoal'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
