import React from 'react';

export default function CandidateTable({ candidates, selectedCandidate, onSelectCandidate }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        No candidate data loaded. Start discovery to populate candidates.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Table Header Section */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Screened Lead Candidates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Results ranked by computational metrics and binding affinity simulations.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium hidden sm:block bg-slate-800/55 px-2.5 py-1 rounded border border-slate-700">
          💡 <span className="text-slate-300">Tip:</span> More negative Docking Scores indicate stronger predicted binding.
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-14">Rank</th>
              <th className="py-3 px-4">Molecule / SMILES</th>
              <th className="py-3 px-4 text-right">Docking Score</th>
              <th className="py-3 px-4 text-right">Drug-likeness (QED)</th>
              <th className="py-3 px-4 text-right">Solubility (ESOL)</th>
              <th className="py-3 px-4 text-center">Toxicity Flags</th>
              <th className="py-3 px-4 text-right w-28">Overall Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {candidates.map((candidate) => {
              const isSelected = selectedCandidate && selectedCandidate.id === candidate.id;
              
              return (
                <tr
                  key={candidate.id}
                  onClick={() => onSelectCandidate(candidate)}
                  className={`cursor-pointer transition-colors hover:bg-slate-800/40 group ${
                    isSelected ? 'bg-slate-800/80 border-l-2 border-emerald-500' : 'bg-transparent'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs ${
                      candidate.rank === 1
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                        : candidate.rank === 2
                          ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20'
                          : 'text-slate-500'
                    }`}>
                      {candidate.rank}
                    </span>
                  </td>

                  {/* Molecule / SMILES */}
                  <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          COMP-{candidate.id.toUpperCase()}
                        </span>
                        {candidate.quantum_selected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 animate-pulse">
                            ⚛️ QUANTUM SELECTED
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 truncate mt-0.5 hover:text-slate-400" title={candidate.smiles}>
                        {candidate.smiles}
                      </span>
                    </div>
                  </td>

                  {/* Docking Score */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                    {candidate.docking_score.toFixed(1)} kcal/mol
                  </td>

                  {/* Drug-likeness (QED) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    {candidate.qed.toFixed(2)}
                  </td>

                  {/* Solubility (ESOL) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    {candidate.esol.toFixed(1)}
                  </td>

                  {/* Toxicity Flags */}
                  <td className="py-3.5 px-4 text-center">
                    {candidate.tox_flags.length === 0 ? (
                      <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        No Flags
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {candidate.tox_flags.map((flag, idx) => (
                          <span key={idx} className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            ⚠ {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Overall Score */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <span className="font-mono font-bold text-slate-200">
                        {candidate.overall_score.toFixed(1)}
                      </span>
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            candidate.overall_score >= 85 
                              ? 'bg-emerald-400' 
                              : candidate.overall_score >= 75
                                ? 'bg-cyan-400'
                                : 'bg-slate-500'
                          }`}
                          style={{ width: `${candidate.overall_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
