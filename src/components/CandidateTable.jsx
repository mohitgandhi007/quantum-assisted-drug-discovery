import React, { useState } from 'react';
import MoleculeImage from './MoleculeImage';
import PropertyBadge from './PropertyBadge';

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Scientific default: Docking score best first (asc, e.g. -9.4 first), Overall score best first (desc, e.g. 91.4 first)
      setSortDirection(field === 'docking_score' ? 'asc' : 'desc');
    }
  };

  // Sort candidates copy based on field & direction
  const sortedCandidates = [...candidates].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (valA === valB) return 0;

    if (sortDirection === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
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
            Results ranked by computational metrics and binding affinity simulations. Click column headers to sort.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium hidden md:block bg-slate-800/55 px-2.5 py-1 rounded border border-slate-700">
          💡 <span className="text-slate-300">Tip:</span> More negative Docking Scores indicate stronger predicted binding.
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
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-900 transition-colors"
                title="Sort by Docking Score"
              >
                Docking Score {renderSortIndicator('docking_score')}
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
                    isSelected ? 'bg-slate-800/75 border-l-2 border-emerald-500' : 'bg-transparent'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
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

                  {/* Molecule / 2D image and ID */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <MoleculeImage smiles={candidate.smiles} id={candidate.id} />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            COMP-{candidate.id.toUpperCase()}
                          </span>
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

                  {/* Docking Score */}
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                    {candidate.docking_score.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">kcal/mol</span>
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
