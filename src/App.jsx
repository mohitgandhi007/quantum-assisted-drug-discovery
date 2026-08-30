import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CandidateTable from './components/CandidateTable';
import EmptyState from './components/EmptyState';
import TargetOverview from './components/StageViews/TargetOverview';
import PipelineSummary from './components/StageViews/PipelineSummary';
import LivePipeline from './components/StageViews/LivePipeline';
import StageDetails from './components/StageViews/StageDetails';
import RunHistory from './components/StageViews/RunHistory';
import { runPipeline, getCandidateDetails, USE_MOCK, API_BASE_URL } from './api/api';

export default function App() {
  const [pipelineData, setPipelineData] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // 'READY', 'RUNNING', 'COMPLETED', 'ERROR'
  const [appStatus, setAppStatus] = useState('READY'); 
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleStartDiscovery = async () => {
    setAppStatus('RUNNING');
    setPipelineData(null);
    setSelectedCandidate(null);
    setActiveStageIndex(-1);
    setError(null);
    setLogs([]);

    addLog('SYSTEM: Initializing QUANTOVIA EGFR lead optimization pipeline.');
    
    // In a real app we'd poll or use websockets. Here we simulate visual progress before hitting backend.
    let visualIndex = 0;
    const stageDurations = [800, 1000, 1000, 1000, 800, 1200, 800];
    
    // We'll create a fake "running" stages array to show progress
    const runningStages = [
      { name: 'Target Validation', status: 'PENDING' },
      { name: 'Molecular Generation', status: 'PENDING' },
      { name: 'Molecular Properties', status: 'PENDING' },
      { name: 'Docking Simulation', status: 'PENDING' },
      { name: 'Classical Ranking', status: 'PENDING' },
      { name: 'Quantum Optimization', status: 'PENDING' },
      { name: 'AI Explanation', status: 'PENDING' }
    ];

    setPipelineData({ stages: runningStages });

    const runVisualStages = async () => {
      if (visualIndex >= stageDurations.length) {
        addLog('SYSTEM: Pipeline stages simulated. Fetching real results from backend...');
        try {
          const data = await runPipeline();
          setPipelineData(data);
          
          if (data.candidates && data.candidates.length > 0) {
            const defaultSelected = data.candidates.find((c) => c.quantum_selection_status) || data.candidates[0];
            try {
                const fullDetails = await getCandidateDetails(defaultSelected.candidate_id);
                setSelectedCandidate(fullDetails || defaultSelected);
                addLog('SYSTEM: Successfully loaded candidate structures and multi-objective scores.');
                setAppStatus('COMPLETED');
            } catch (explErr) {
                // If only the explanation fails, the pipeline still completed successfully, but AI explanation failed.
                setError(explErr.message);
                addLog(`ERROR: ${explErr.message}`);
                setSelectedCandidate(defaultSelected);
                setAppStatus('COMPLETED'); 
                // We keep appStatus as completed because the overall pipeline data loaded.
                // We'll let the user see the data without the explanation, or they can click "Use Fallback".
            }
          } else {
             addLog('SYSTEM: Pipeline returned no candidates.');
             setAppStatus('COMPLETED');
          }
          setActiveStageIndex(0); // Select the first stage to view
        } catch (err) {
          setError(err.message);
          addLog(`ERROR: ${err.message}`);
          setAppStatus('ERROR');
          // Important: Update the stuck visual stage to show it didn't complete
          setPipelineData(prev => {
             if (!prev) return prev;
             const newStages = [...prev.stages];
             newStages[visualIndex - 1].status = 'FAILED';
             return { ...prev, stages: newStages };
          });
        }
        return;
      }

      setActiveStageIndex(visualIndex);
      
      setPipelineData(prev => {
        if (!prev) return prev;
        const newStages = [...prev.stages];
        if (visualIndex > 0) newStages[visualIndex - 1].status = 'COMPLETED';
        newStages[visualIndex].status = 'RUNNING';
        return { ...prev, stages: newStages };
      });

      switch (visualIndex) {
        case 0:
          addLog('TARGET: PDB 1M17 loaded. Generating binding pocket representations.');
          break;
        case 1:
          addLog('GENERATION: Running BRICS fragmentation and recombination.');
          break;
        case 2:
          addLog('PROPERTIES: Filtering valid SMILES via RDKit. Calculating QED, ESOL, and PAINS alerts.');
          break;
        case 3:
          addLog('DOCKING: Aligning structures. Calculating binding affinity proxies.');
          break;
        case 4:
          addLog('RANKING: Applying multi-objective classical scoring function.');
          break;
        case 5:
          addLog('QUANTUM: Formulating QUBO. Offloading QAOA simulation to Qiskit backend.');
          break;
        case 6:
          addLog('EXPLANATION: Aggregating clinical explanations for top selected structures.');
          break;
        default:
          break;
      }

      setTimeout(() => {
        visualIndex++;
        runVisualStages();
      }, stageDurations[visualIndex]);
    };

    runVisualStages();
  };

  const handleCandidateSelect = async (candidate) => {
    try {
      const fullDetails = await getCandidateDetails(candidate.candidate_id);
      setSelectedCandidate(fullDetails || candidate);
    } catch (e) {
      console.error(e);
      addLog(`ERROR: Failed to load details for ${candidate.candidate_id}: ${e.message}`);
      setSelectedCandidate(candidate);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-quantovia-off-white flex flex-col font-sans">
      <Header isMock={USE_MOCK} status={appStatus} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Pipeline Control & Timeline */}
        <section className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg">
             <button
                onClick={handleStartDiscovery}
                disabled={appStatus === 'RUNNING'}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-wider shadow transition duration-200 ${
                  appStatus === 'RUNNING'
                    ? 'bg-quantovia-charcoal text-slate-500 border border-quantovia-charcoal cursor-not-allowed'
                    : 'bg-quantovia-teal hover:bg-quantovia-deep-teal text-quantovia-off-white hover:shadow-[0_0_15px_rgba(97,146,154,0.5)] cursor-pointer'
                }`}
              >
                {appStatus === 'RUNNING' ? 'PIPELINE ACTIVE...' : '▶ RUN DISCOVERY PIPELINE'}
              </button>
          </div>

          {pipelineData?.target && <TargetOverview target={pipelineData.target} />}
          
          {pipelineData?.stages && (
            <LivePipeline 
               stages={pipelineData.stages} 
               activeStageIndex={activeStageIndex}
               onStageClick={setActiveStageIndex}
            />
          )}

          {pipelineData?.stages && activeStageIndex >= 0 && (
             <StageDetails 
                stage={pipelineData.stages[activeStageIndex]} 
                candidates={pipelineData.candidates}
                quantum={pipelineData.quantum}
             />
          )}

          {/* Terminal / Logs */}
          <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg flex flex-col h-64">
             <div className="flex items-center justify-between mb-3 border-b border-quantovia-charcoal pb-2">
               <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                 <span className={`h-2 w-2 rounded-full ${appStatus === 'RUNNING' ? 'bg-quantovia-lime-sage animate-ping' : 'bg-slate-600'}`}></span>
                 Pipeline Activity Log
               </h3>
             </div>
             <div className="flex-1 bg-slate-950 rounded border border-quantovia-charcoal p-4 font-mono text-[10px] leading-relaxed text-slate-400 overflow-y-auto space-y-1.5 flex flex-col-reverse">
               {appStatus === 'RUNNING' && (
                 <div className="text-quantovia-lime-sage animate-pulse flex items-center gap-1 mt-2">
                   <span>█</span> Processing node...
                 </div>
               )}
               {[...logs].reverse().map((log, index) => {
                 let logClass = 'text-slate-300';
                 if (log.includes('ERROR')) logClass = 'text-rose-400';
                 else if (log.includes('SYSTEM')) logClass = 'text-quantovia-lime-sage';
                 else if (log.includes('QUANTUM')) logClass = 'text-cyan-400 font-bold';
                 return (
                   <div key={index} className={logClass}>
                     {log}
                   </div>
                 );
               })}
             </div>
          </div>
          
          <RunHistory />

        </section>

        {/* Right Column - Results */}
        <section className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
          
          {appStatus === 'READY' && (!pipelineData || !pipelineData.candidates) && (
            <EmptyState />
          )}

          {appStatus === 'ERROR' && (
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-6 text-rose-400 shadow-lg">
              <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                <span>⚠</span> {pipelineData?.stages?.[activeStageIndex]?.name || 'PIPELINE'} FAILED
              </h3>
              <p className="text-xs text-slate-400 mt-2 p-3 bg-slate-950 border border-rose-900/50 rounded font-mono">
                {error}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleStartDiscovery}
                  className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 rounded border border-rose-500/30 transition cursor-pointer"
                >
                  Retry Stage
                </button>
                <button
                  onClick={handleStartDiscovery}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded border border-slate-600 transition cursor-pointer"
                >
                  Use Fallback
                </button>
              </div>
            </div>
          )}

          {pipelineData?.summary && (
            <PipelineSummary summary={pipelineData.summary} />
          )}

          {/* Candidates Dashboard */}
          {appStatus === 'COMPLETED' && pipelineData?.candidates && !error && (
            <div className="flex flex-col gap-6">
              
              <CandidateTable
                candidates={pipelineData.candidates}
                selectedCandidate={selectedCandidate}
                onSelectCandidate={handleCandidateSelect}
              />

              {/* Selected Candidate Detailed Inspection */}
              {selectedCandidate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  
                  {/* Molecule 2D Details */}
                  <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg flex flex-col items-center justify-center relative min-h-[300px]">
                    <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      2D Structure Viewer
                    </span>
                    <div className="w-full h-48 bg-white/5 rounded mt-4 p-2 flex items-center justify-center">
                       <img 
                          src={`${API_BASE_URL}/molecule/image?smiles=${encodeURIComponent(selectedCandidate.smiles)}`}
                          alt="2D Structure"
                          className="max-w-full max-h-full object-contain mix-blend-screen invert opacity-90"
                       />
                    </div>
                    <div className="w-full mt-4 bg-slate-950/60 border border-quantovia-charcoal rounded p-2 text-center break-all font-mono text-[10px] text-slate-400">
                      {selectedCandidate.smiles}
                    </div>
                  </div>

                  {/* Properties & Quantum Results */}
                  <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-quantovia-charcoal pb-3 mb-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Lead</span>
                          <h3 className="text-base font-bold text-quantovia-off-white font-mono mt-0.5">
                            COMP-{selectedCandidate.candidate_id.split('-')[0].toUpperCase()}
                          </h3>
                        </div>
                        {selectedCandidate.quantum_selection_status && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-700/50">
                            QAOA Optimized ✓
                          </span>
                        )}
                      </div>

                      {/* Bio-properties list */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono mb-4">
                        <div className="text-slate-500">Classical Score:</div>
                        <div className="text-right text-quantovia-teal font-bold">{selectedCandidate.classical_score?.toFixed(3)}</div>
                        
                        <div className="text-slate-500">Drug-likeness (QED):</div>
                        <div className="text-right text-slate-200">{selectedCandidate.properties?.qed?.toFixed(2)}</div>
                        
                        <div className="text-slate-500">Solubility (ESOL):</div>
                        <div className="text-right text-slate-200">{selectedCandidate.properties?.esol?.toFixed(2)}</div>
                        
                        <div className="text-slate-500">Molecular Weight:</div>
                        <div className="text-right text-slate-200">{selectedCandidate.properties?.molecular_weight?.toFixed(1)}</div>
                        
                        <div className="text-slate-500">Docking Source:</div>
                        <div className="text-right text-slate-400">{selectedCandidate.binding_evidence?.method || 'N/A'}</div>
                      </div>
                      
                      {/* Explanation block */}
                      {selectedCandidate.explanation && (
                         <div className="bg-slate-950/60 border border-quantovia-charcoal rounded-lg p-3 text-xs leading-relaxed">
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                              🤖 AI Candidate Profile
                            </h4>
                            {selectedCandidate.explanation_source && (
                               <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${selectedCandidate.explanation_source.includes('AI') ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50' : 'bg-slate-800 text-slate-400 border border-slate-600'}`}>
                                 {selectedCandidate.explanation_source}
                               </span>
                            )}
                          </div>
                          <p className="text-slate-300 whitespace-pre-wrap mt-2 border-t border-quantovia-charcoal/50 pt-2">
                            {selectedCandidate.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      <footer className="mt-auto border-t border-quantovia-charcoal bg-slate-950 px-6 py-4 text-center text-[11px] text-slate-600 font-mono tracking-wider">
        © 2026 QUANTOVIA HACKATHON PROJECT. FOR DEMONSTRATION PURPOSES ONLY.
      </footer>
    </div>
  );
}
