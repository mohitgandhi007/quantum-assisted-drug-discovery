import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PipelineStages from './components/PipelineStages';
import CandidateTable from './components/CandidateTable';
import MoleculeViewer from './components/MoleculeViewer';
import EmptyState from './components/EmptyState';
import CandidateDetails from './components/CandidateDetails';
import Disclaimer from './components/Disclaimer';
import { mockPipelineStages } from './api/mockData';
import { getCandidates, USE_MOCK } from './api/api';

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hasDiscovered, setHasDiscovered] = useState(false);

  // Generate automated clinical explanation for the selected candidate
  const getExplanation = (candidate) => {
    if (!candidate) return '';
    switch (candidate.id) {
      case 'c1':
        return 'COMP-C1 is the primary lead candidate. It is a Gefitinib-like structure predicted to fit cleanly into the EGFR tyrosine kinase active site (PDB: 1M17). It establishes strong hydrogen bonding networks with Met793. Highly favorable drug-likeness and complete absence of toxicity flags make it an excellent candidate for synthesis.';
      case 'c2':
        return 'COMP-C2 is a Lapatinib analogue showing high binding affinity. However, it displays a higher molecular weight (MW > 500) and slightly reduced solubility, resulting in a "High MW" flag. It remains a backup lead compound.';
      case 'c3':
        return 'COMP-C3 resembles Afatinib, showing irreversible binding kinetics. No critical toxicity flags were detected, and it shows balanced drug-likeness (QED = 0.72) and ESOL solubility (-3.5).';
      case 'c4':
        return 'COMP-C4 is an Osimertinib-like compound designed to target EGFR T790M resistance mutations. It shows strong docking score (-8.1) but carries a minor hepatotoxicity risk flagging, requiring structural modifications.';
      case 'c5':
        return 'COMP-C5 is an Erlotinib derivative. It shows the highest drug-likeness index (QED = 0.81) and excellent solubility (-2.9). However, models flagged mutagenic potential in high concentrations, which may limit development.';
      default:
        return 'Structure profiling in progress.';
    }
  };

  const addLog = (message) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleStartDiscovery = () => {
    setIsPipelineRunning(true);
    setCandidates([]);
    setSelectedCandidate(null);
    setCurrentStageIndex(0);
    setError(null);
    setLogs([]);
    setHasDiscovered(false);

    addLog('SYSTEM: Initializing EGFR receptor lead optimization pipeline.');
    addLog('RESEARCH: Querying RCSB database for target structure: PDB 1M17.');
  };

  // Pipeline simulation timeouts
  useEffect(() => {
    if (!isPipelineRunning) return;

    let timer;
    const stageDurations = [1200, 1500, 1200, 1800, 1500, 1200];
    
    const runNextStage = (index) => {
      if (index >= mockPipelineStages.length) {
        // Pipeline completed. Fetch final candidates.
        setLoading(true);
        addLog('SYSTEM: Pipeline completed. Fetching lead candidate details...');
        
        getCandidates()
          .then((data) => {
            setCandidates(data);
            setHasDiscovered(true);
            // Default select the top rank candidate (or quantum selected)
            const defaultSelected = data && data.length > 0
              ? (data.find((c) => c.quantum_selected) || data[0])
              : null;
            setSelectedCandidate(defaultSelected);
            addLog('SYSTEM: Successfully loaded candidate structures and scores.');
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message);
            addLog(`ERROR: ${err.message}`);
            setLoading(false);
          })
          .finally(() => {
            setIsPipelineRunning(false);
          });
        return;
      }

      timer = setTimeout(() => {
        const nextIndex = index + 1;
        setCurrentStageIndex(nextIndex);

        // Add scientific logs corresponding to each stage transistion
        switch (nextIndex) {
          case 1:
            addLog('RESEARCH: Receptor target loaded. Target pocket coordinates mapped.');
            addLog('GENERATION: Launching deep generative chemistry models.');
            break;
          case 2:
            addLog('GENERATION: Sampled 10,000 chemical SMILES. Filtered top 100.');
            addLog('PROPERTIES: Calculating ADMET profiles, QED scores, and ESOL solubility.');
            break;
          case 3:
            addLog('PROPERTIES: Filtered candidates to top 5 based on solubility and drug-likeness.');
            addLog('DOCKING: Initiating Autodock Vina binding affinity calculations.');
            break;
          case 4:
            addLog('DOCKING: Finished docking simulations. Scores ranges from -7.8 to -9.4 kcal/mol.');
            addLog('QUANTUM: Offloading lead configuration configurations to Qiskit-Quantum simulator.');
            break;
          case 5:
            addLog('QUANTUM: Pocket-fitting completed. Quantum stage selected COMP-C1.');
            addLog('EXPLANATION: Formatting properties, toxicity profiles, and clinical explanations.');
            break;
          default:
            break;
        }

        runNextStage(nextIndex);
      }, stageDurations[index]);
    };

    runNextStage(0);

    return () => clearTimeout(timer);
  }, [isPipelineRunning]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header component */}
      <Header isMock={USE_MOCK} />

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Inputs & Pipeline Control */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Target input section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              📂 Discovery Input Specs
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-semibold uppercase">Receptor Target</label>
                <div className="mt-1 font-mono text-sm bg-slate-950 px-3 py-2 rounded border border-slate-800 text-cyan-400 font-bold">
                  EGFR (Epidermal Growth Factor Receptor)
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-semibold uppercase">Target PDB Structure</label>
                <div className="mt-1 font-mono text-sm bg-slate-950 px-3 py-2 rounded border border-slate-800 text-cyan-400">
                  1M17
                </div>
              </div>
              <button
                onClick={handleStartDiscovery}
                disabled={isPipelineRunning}
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider shadow transition duration-200 ${
                  isPipelineRunning
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer'
                }`}
              >
                {isPipelineRunning ? 'Discovery Active...' : 'Run Discovery Pipeline'}
              </button>
            </div>
          </div>

          {/* Pipeline stages checklist */}
          <PipelineStages
            stages={mockPipelineStages}
            currentStageIndex={currentStageIndex}
            isRunning={isPipelineRunning}
          />
        </section>

        {/* Right Column - Results, Terminal Logs and 3D Visualizer */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Show empty state when pipeline hasn't run and no candidates exist */}
          {!isPipelineRunning && !hasDiscovered && candidates.length === 0 && !loading && !error && (
            <EmptyState onStartDiscovery={handleStartDiscovery} isRunning={isPipelineRunning} />
          )}

          {/* Show empty candidates results state when discovery produces nothing */}
          {!isPipelineRunning && hasDiscovered && candidates.length === 0 && !loading && !error && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-lg my-6 max-w-2xl mx-auto flex flex-col items-center">
              <span className="text-slate-500 text-3xl mb-3">🔍</span>
              <h3 className="text-sm font-semibold text-slate-300">No candidate molecules available yet.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                The discovery pipeline completed, but no lead structures were returned. Make sure the generation stage produced valid candidates.
              </p>
              <button
                onClick={handleStartDiscovery}
                className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded border border-slate-700 transition cursor-pointer"
              >
                Re-run Discovery
              </button>
            </div>
          )}

          {/* Error Message Panel */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-6 text-center text-rose-400 shadow-lg">
              <h3 className="font-bold text-sm">⚠ Discovery Pipeline Interrupted</h3>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
              <button
                onClick={handleStartDiscovery}
                className="mt-4 px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 rounded border border-rose-500/30 transition cursor-pointer"
              >
                Retry Pipeline
              </button>
            </div>
          )}

          {/* Live Simulation Logs / Terminal Output */}
          {(isPipelineRunning || logs.length > 0) && candidates.length === 0 && !error && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                  Console Pipeline Logs
                </h3>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-400/5 border border-cyan-400/10">
                  Active
                </span>
              </div>
              <div className="flex-1 bg-slate-950 rounded border border-slate-800/80 p-4 font-mono text-[11px] leading-relaxed text-slate-400 overflow-y-auto space-y-1.5 max-h-[450px]">
                {logs.map((log, index) => (
                  <div key={index} className={log.includes('ERROR') ? 'text-rose-400' : log.includes('SYSTEM') ? 'text-emerald-400' : 'text-slate-300'}>
                    {log}
                  </div>
                ))}
                {(isPipelineRunning || loading) && (
                  <div className="text-cyan-400 animate-pulse flex items-center gap-1 mt-2">
                    <span>█</span> {loading ? 'Querying lead candidate data nodes...' : 'Running calculation node...'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loaded Lead Candidates Results Dashboard */}
          {candidates.length > 0 && !error && (
            <div className="flex flex-col gap-6">
              
              {/* Candidates Table */}
              <CandidateTable
                candidates={candidates}
                selectedCandidate={selectedCandidate}
                onSelectCandidate={setSelectedCandidate}
              />

              {/* Selected Candidate Detailed Inspection Grid */}
              {selectedCandidate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  
                  {/* Molecule 3D Visualizer */}
                  <div className="h-[420px]">
                    <MoleculeViewer pdbId="1M17" />
                  </div>

                  {/* Detailed candidate profile inspector */}
                  <CandidateDetails candidate={selectedCandidate} />
                  
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      {/* persistent regulatory & validation disclaimer banner */}
      <Disclaimer />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-600 font-mono">
        © 2026 Hackathon AI Drug Discovery Project. Demo outputs only. Real validation requires wet lab trials.
      </footer>
    </div>
  );
}
