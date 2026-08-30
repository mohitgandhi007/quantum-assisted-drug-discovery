import React, { useState } from 'react';
import MoleculeImage from './MoleculeImage';
import PropertyBadge from './PropertyBadge';
import DockingBadge from './DockingBadge';

export default function CandidateTable({ candidates, selectedCandidate, onSelectCandidate }) {
  const [sortField, setSortField] = useState('overall_score');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        No candidate data loaded. Start discovery to populate candidates.
      </div>
    );
  }

  // Determine if backend data represents the similarity proxy fallback
  const isProxyMode = candidates.some(
    (c) => c.binding_method === 'similarity_proxy' && (c.docking_score === null || c.docking_score === undefined)
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // For real docking score, more negative is better (default asc)
      // For proxy/overall scores, higher is better (default desc)
      const defaultDir = (field === 'docking_score' && !isProxyMode) ? 'asc' : 'desc';
      setSortDirection(defaultDir);
    }
  };

  // Sort candidates copy based on field & direction
  const sortedCandidates = [...candidates].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // If sorting by docking score but in proxy mode, compare binding_proxy values instead
    if (sortField === 'docking_score' && isProxyMode) {
      valA = a.binding_proxy;
      valB = b.binding_proxy;
    }

    // Always put invalid/null/pending scores at the bottom regardless of sort direction
    const isValAInvalid = valA === undefined || valA === null;
    const isValBInvalid = valB === undefined || valB === null;

    if (isValAInvalid && isValBInvalid) return 0;
    if (isValAInvalid) return 1;
    if (isValBInvalid) return -1;

    if (valA === valB) return 0;

    const isAscendingSort = sortDirection === 'asc';
    const isLowerBetter = sortField === 'docking_score' && !isProxyMode;

    if (isLowerBetter) {
      return isAscendingSort ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    } else {
      return isAscendingSort ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    }
  });

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <span className="text-slate-600 ml-1">↕</span>;
    return sortDirection === 'asc' ? (
      <span className="text-cyan-400 ml-1">▲</span>
    ) : (
      <span className="text-cyan-400 ml-1">▼</span>
    );
  };

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
            Results ranked by computational metrics. Click column headers to sort.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium hidden md:block bg-slate-800/55 px-2.5 py-1 rounded border border-slate-700">
          {isProxyMode ? (
            <span>💡 <strong>Binding similarity:</strong> Closer to 1.0 indicates higher Tanimoto similarity to Erlotinib reference.</span>
          ) : (
            <span>💡 <strong>Binding energy:</strong> More negative predicted Docking Scores indicate stronger binding.</span>
          )}
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
              <th className="py-3 px-4 text-center w-14">Rank</th>
              <th className="py-3 px-4">Molecule Structure / SMILES</th>
              <th 
                onClick={() => handleSort('docking_score')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-900 transition-colors w-48"
                title={isProxyMode ? "Sort by Binding Similarity" : "Sort by Predicted Docking Score"}
              >
                {isProxyMode ? 'Binding Similarity' : 'Docking Score'} {renderSortIndicator('docking_score')}
              </th>
              <th className="py-3 px-4 text-right">QED (Drug-likeness)</th>
              <th className="py-3 px-4 text-right">ESOL (Solubility)</th>
              <th className="py-3 px-4 text-center">Toxicity Flags</th>
              <th 
                onClick={() => handleSort('overall_score')}
                className="py-3 px-4 text-right w-36 cursor-pointer hover:bg-slate-900 transition-colors"
                title="Sort by Overall Score"
              >
                Overall Score {renderSortIndicator('overall_score')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {sortedCandidates.map((candidate) => {
              const isSelected = selectedCandidate && selectedCandidate.id === candidate.id;
              
              return (
                <tr
                  key={candidate.id}
                  onClick={() => onSelectCandidate(candidate)}
                  className={`cursor-pointer transition-colors hover:bg-slate-800/40 group ${
                    isSelected 
                      ? 'bg-slate-800/75 border-l-2 border-emerald-500' 
                      : candidate.is_reference
                        ? 'bg-amber-500/[0.02] border-l-2 border-amber-500/20'
                        : 'bg-transparent'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs ${
                      candidate.is_reference
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                        : candidate.rank === 1
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                          : candidate.rank === 2
                            ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20'
                            : 'text-slate-500'
                    }`}>
                      {candidate.is_reference ? '★' : candidate.rank}
                    </span>
                  </td>

                  {/* Molecule / 2D image and ID */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <MoleculeImage smiles={candidate.smiles} id={candidate.id} />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1">
                            {candidate.is_reference && <span className="text-amber-400">★</span>}
                            COMP-{candidate.id.toUpperCase()}
                          </span>
                          {candidate.is_reference && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Reference
                            </span>
                          )}
                          {candidate.quantum_selected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 animate-pulse">
                              ⚛️ QUANTUM
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 truncate mt-0.5 max-w-[160px] sm:max-w-[200px]" title={candidate.smiles}>
                          {candidate.smiles}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Docking Score or Proxy Badge */}
                  <td className="py-3 px-4 text-right">
                    <DockingBadge 
                      dockingScore={candidate.docking_score} 
                      bindingProxy={candidate.binding_proxy} 
                      bindingMethod={candidate.binding_method} 
                    />
                  </td>

                  {/* Drug-likeness (QED) using badge */}
                  <td className="py-3 px-4 text-right">
                    <PropertyBadge type="qed" value={candidate.qed} />
                  </td>

                  {/* Solubility (ESOL) using badge */}
                  <td className="py-3 px-4 text-right">
                    <PropertyBadge type="esol" value={candidate.esol} />
                  </td>

                  {/* Toxicity Flags */}
                  <td className="py-3 px-4 text-center">
                    <PropertyBadge type="toxicity" value={candidate.tox_flags} />
                  </td>

                  {/* Overall Score */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <span className="font-mono font-bold text-slate-200">
                        {candidate.overall_score !== undefined ? candidate.overall_score.toFixed(1) : "N/A"}
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
                          style={{ width: `${candidate.overall_score || 0}%` }}
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
