import React from 'react';
import { API_BASE_URL } from '../api/api';

export default function CandidateTable({ candidates, selectedCandidate, onSelectCandidate }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-surface-100 border border-surface-300 rounded-xl p-8 text-center text-quantovia-sage">
        No candidate data loaded. Start discovery to populate candidates.
      </div>
    );
  }

  return (
    <div className="bg-surface-100 border border-surface-300 rounded-xl shadow-sm overflow-hidden">
      {/* Table Header Section */}
      <div className="px-5 py-4 border-b border-surface-300 bg-surface-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-quantovia-charcoal flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-quantovia-teal"></span>
            Screened Lead Candidates
          </h2>
          <p className="text-xs text-quantovia-sage mt-0.5">
            Results ranked by multi-objective metrics and binding proxies.
          </p>
        </div>
        <div className="text-xs text-quantovia-sage font-medium hidden sm:block bg-surface-200 px-2.5 py-1 rounded border border-surface-300">
          💡 <span className="text-quantovia-charcoal">Tip:</span> Lower binding scores indicate stronger predicted affinity.
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-200 border-b border-surface-300 text-xs font-semibold text-quantovia-sage uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-14">Rank</th>
              <th className="py-3 px-4">Molecule (2D) / SMILES</th>
              <th className="py-3 px-4 text-right">Binding Score</th>
              <th className="py-3 px-4 text-right">Drug-likeness (QED)</th>
              <th className="py-3 px-4 text-right">Solubility (ESOL)</th>
              <th className="py-3 px-4 text-center">PAINS / Tox</th>
              <th className="py-3 px-4 text-right w-28">Classical Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-300 text-sm">
            {candidates.map((candidate, i) => {
              const isSelected = selectedCandidate && selectedCandidate.candidate_id === candidate.candidate_id;
              const rank = candidate.ranking || (i + 1);
              
              // Handle binding score mapping
              let bindingScore = "N/A";
              if (candidate.binding_evidence && candidate.binding_evidence.score !== null) {
                bindingScore = candidate.binding_evidence.score.toFixed(3);
              } else if (candidate.docking_score !== undefined && candidate.docking_score !== null) {
                // Fallback for mock mapping if still passed
                bindingScore = candidate.docking_score.toFixed(3); 
              }

              return (
                <tr
                  key={candidate.candidate_id}
                  onClick={() => onSelectCandidate(candidate)}
                  className={`cursor-pointer transition-colors group ${
                    isSelected ? 'bg-surface-200/50 border-l-[3px] border-quantovia-teal' : 'bg-transparent hover:bg-surface-200/50 border-l-[3px] border-transparent'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-quantovia-charcoal">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs ${
                      rank === 1
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : rank === 2
                          ? 'bg-surface-300 text-quantovia-charcoal border border-surface-300'
                          : 'text-quantovia-sage'
                    }`}>
                      {rank}
                    </span>
                  </td>

                  {/* Molecule 2D / SMILES */}
                  <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                    <div className="flex items-center gap-3">
                      {/* Molecule Thumbnail */}
                      <div className="flex-shrink-0 w-16 h-16 bg-white rounded flex items-center justify-center overflow-hidden border border-surface-300 shadow-sm">
                        <img 
                          src={`${API_BASE_URL}/molecule/image?smiles=${encodeURIComponent(candidate.smiles)}`}
                          alt="2D Structure"
                          className="w-full h-full object-contain mix-blend-multiply opacity-100"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-quantovia-charcoal">
                            COMP-{candidate.candidate_id.split('-')[0].toUpperCase()}
                          </span>
                          {candidate.quantum_selection_status && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-quantovia-teal/10 text-quantovia-forest border border-quantovia-teal/30">
                              ⚛️ Q-OPTIMIZED
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-quantovia-sage truncate mt-1" title={candidate.smiles}>
                          {candidate.smiles}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Docking Score */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-quantovia-deep-teal">
                    {bindingScore}
                  </td>

                  {/* Drug-likeness (QED) */}
                  <td className="py-3.5 px-4 text-right font-mono text-quantovia-charcoal">
                    {candidate.properties?.qed?.toFixed(2) || 'N/A'}
                  </td>

                  {/* Solubility (ESOL) */}
                  <td className="py-3.5 px-4 text-right font-mono text-quantovia-charcoal">
                    {candidate.properties?.esol?.toFixed(2) || 'N/A'}
                  </td>

                  {/* Toxicity Flags */}
                  <td className="py-3.5 px-4 text-center">
                    {!candidate.properties?.pains_flag ? (
                      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-surface-200 text-quantovia-sage border border-surface-300">
                        No Alerts
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                        ⚠ PAINS ({candidate.properties?.pains_alert_count})
                      </span>
                    )}
                  </td>

                  {/* Overall Score */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <span className="font-mono font-bold text-quantovia-charcoal">
                        {candidate.classical_score ? candidate.classical_score.toFixed(3) : 'N/A'}
                      </span>
                      <div className="w-12 bg-surface-300 rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            (candidate.classical_score || 0) >= 0.7 
                              ? 'bg-quantovia-forest' 
                              : (candidate.classical_score || 0) >= 0.5
                                ? 'bg-quantovia-teal'
                                : 'bg-quantovia-sage'
                          }`}
                          style={{ width: `${Math.min(((candidate.classical_score || 0) * 100), 100)}%` }}
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
