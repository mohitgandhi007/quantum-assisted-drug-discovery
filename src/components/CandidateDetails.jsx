import React, { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import { API_BASE_URL } from '../api/api';

export default function CandidateDetails({ candidate }) {
  const [copied, setCopied] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Reset image loading states when a new candidate is selected
  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
    setCopied(false);
  }, [candidate?.id]);

  if (!candidate) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[300px]">
        <span>🔬</span>
        <p className="text-sm mt-2">Select a compound from the table to inspect details.</p>
      </div>
    );
  }

  const handleCopySMILES = () => {
    if (candidate.smiles) {
      navigator.clipboard.writeText(candidate.smiles)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy SMILES to clipboard:", err);
        });
    }
  };

  const imageUrl = `${API_BASE_URL}/api/molecule/image?smiles=${encodeURIComponent(candidate.smiles)}`;

  // Custom tooltips/descriptions for toxicity flags
  const getAlertDescription = (flag) => {
    if (flag.toLowerCase().includes('high mw')) {
      return "Molecular weight exceeds 500 Da (Lipinski parameter alert).";
    }
    if (flag.toLowerCase().includes('hepatotoxicity')) {
      return "Flagged by ADMET screening filter for potential hepatic risk.";
    }
    if (flag.toLowerCase().includes('mutagenic')) {
      return "Flagged by mutagenicity structural-alert models (Ames test).";
    }
    return "Flagged by a PAINS/Brenk structural-alert filter. Structural alert detected. Note: alert ≠ proof of toxicity.";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full justify-between">
      <div>
        {/* Candidate Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Selected Compound Profile
              </span>
              {candidate.is_reference ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ★ Known Active Reference
                </span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Generated Lead
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-200 font-mono mt-0.5 flex items-center gap-2">
              COMP-{candidate.id.toUpperCase()}
              {candidate.quantum_selected && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 animate-pulse font-normal">
                  ⚛️ Quantum Prime
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono text-slate-400">
              Rank: <span className="text-slate-100 font-bold">{candidate.rank || "N/A"}</span>
            </div>
            <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono text-slate-400">
              Score: <span className="text-cyan-400 font-bold">{candidate.overall_score !== undefined ? candidate.overall_score.toFixed(1) : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* 2D Molecule Visualization */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            2D Structure Graph
          </label>
          <div className="relative w-full h-40 bg-white rounded border border-slate-800 flex items-center justify-center overflow-hidden p-3 shadow-inner select-none">
            {imgLoading && !imgError && (
              <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-slate-300 border-t-cyan-500 animate-spin mb-1" />
                <span className="text-[9px] text-slate-500 font-mono">Loading structure...</span>
              </div>
            )}
            
            {imgError ? (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-3 text-center">
                <span className="text-rose-400 text-lg mb-1">⚠</span>
                <span className="text-xs font-semibold text-slate-400">Unable to load molecular structure</span>
                <span className="text-[9px] text-slate-600 mt-0.5">SMILES format is unavailable or the image service is offline.</span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={`Structure of ${candidate.id}`}
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgError(true);
                  setImgLoading(false);
                }}
                className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                  imgLoading ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
          </div>
        </div>

        {/* SMILES Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Molecular SMILES String
            </label>
            <button
              onClick={handleCopySMILES}
              className="text-[9px] text-slate-400 hover:text-cyan-400 font-semibold flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 transition"
              title="Copy SMILES to Clipboard"
            >
              {copied ? '✓ Copied' : '⧉ Copy'}
            </button>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded border border-slate-800/80 font-mono text-[10px] text-slate-400 select-all break-all max-h-16 overflow-y-auto">
            {candidate.smiles || "Not available"}
          </div>
        </div>

        {/* Properties Breakdown Grid */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            RDKit Computed Properties
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <PropertyCard
              label="QED"
              value={candidate.qed}
              explanation="Quantitative drug-likeness"
            />
            <PropertyCard
              label="Mol Weight"
              value={candidate.mol_weight}
              unit="Da"
              explanation="Molecular mass in Daltons"
            />
            <PropertyCard
              label="LogP"
              value={candidate.logp}
              explanation="Octanol-water partition"
            />
            <PropertyCard
              label="ESOL Solubility"
              value={candidate.esol}
              unit="logS"
              explanation="Calculated solubility index"
            />
            <PropertyCard
              label="Lipinski Violations"
              value={candidate.lipinski_violations}
              explanation="Rule-of-five violation count"
            />
          </div>
        </div>

        {/* Toxicity / Structural Alerts */}
        <div className="mb-4 border-t border-slate-800 pt-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Safety &amp; Structural Alerts
          </label>
          {(!candidate.tox_flags || candidate.tox_flags.length === 0) ? (
            <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-lg p-2.5 flex items-center gap-2">
              <span className="text-emerald-400 text-xs">✓</span>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                No structural alerts detected.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {candidate.tox_flags.map((flag, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-rose-400">
                      {flag}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 pl-3 font-sans leading-relaxed">
                    {getAlertDescription(flag)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scientific Predictive Placeholders */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
          {/* Docking Placeholder */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Binding Energy Simulation
            </label>
            <div className="bg-slate-950 px-3 py-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Docking score</span>
              <span className={`text-xs font-mono font-bold mt-0.5 block ${
                candidate.docking_score !== undefined ? 'text-emerald-400' : 'text-slate-500 italic'
              }`}>
                {candidate.docking_score !== undefined 
                  ? `${candidate.docking_score.toFixed(1)} kcal/mol` 
                  : 'Pending docking'}
              </span>
            </div>
          </div>

          {/* Quantum Placeholder */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Quantum Screen Node
            </label>
            <div className="bg-slate-950 px-3 py-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Qiskit VQE fitting</span>
              <span className={`text-xs font-mono font-bold mt-0.5 block ${
                candidate.quantum_selected !== undefined 
                  ? candidate.quantum_selected 
                    ? 'text-cyan-400' 
                    : 'text-slate-400'
                  : 'text-slate-500 italic'
              }`}>
                {candidate.quantum_selected !== undefined 
                  ? candidate.quantum_selected 
                    ? 'Selected Lead' 
                    : 'Not selected'
                  : 'Pending quantum stage'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9px] text-slate-600 font-mono text-center">
        Lead screening matches EGF receptor binding pocket 3D coordinates.
      </div>
    </div>
  );
}
