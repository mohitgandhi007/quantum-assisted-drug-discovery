

# src/App.css
```css
/* Main App Styles */

```


# src/index.css
```css
@import "tailwindcss";

@theme {
  --color-quantovia-charcoal: #323D47;
  --color-quantovia-teal: #61929A;
  --color-quantovia-deep-teal: #437B9B;
  --color-quantovia-sage: #689159;
  --color-quantovia-lime-sage: #92B157;
  --color-quantovia-pale-sage: #D4E0DB;
  --color-quantovia-off-white: #F8F9FA;
}

```


# src/main.jsx
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```


# src/App.jsx
```jsx
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

```


# src/components/Header.jsx
```jsx
import React from 'react';

export default function Header({ isMock, status = 'READY' }) {
  // status: 'READY', 'RUNNING', 'COMPLETED', 'ERROR'
  
  const getStatusStyles = () => {
    if (isMock) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    switch (status) {
      case 'RUNNING': return 'bg-quantovia-lime-sage/10 border-quantovia-lime-sage/30 text-quantovia-lime-sage';
      case 'COMPLETED': return 'bg-quantovia-teal/10 border-quantovia-teal/30 text-quantovia-teal';
      case 'ERROR': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'READY':
      default:
        return 'bg-quantovia-sage/10 border-quantovia-sage/30 text-quantovia-sage';
    }
  };

  const getStatusDot = () => {
    if (isMock) return 'bg-amber-400';
    switch (status) {
      case 'RUNNING': return 'bg-quantovia-lime-sage animate-pulse';
      case 'COMPLETED': return 'bg-quantovia-teal';
      case 'ERROR': return 'bg-rose-400';
      case 'READY':
      default:
        return 'bg-quantovia-sage';
    }
  };

  return (
    <header className="border-b border-quantovia-charcoal bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title and Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-quantovia-deep-teal/20 border border-quantovia-deep-teal/50 flex items-center justify-center text-quantovia-teal font-mono font-bold text-lg shadow-inner">
            Q
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-quantovia-off-white tracking-tight flex items-center gap-2">
              QUANTOVIA
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-quantovia-charcoal/50 text-quantovia-pale-sage border border-quantovia-charcoal">
                v1.0 • HACKATHON
              </span>
            </h1>
            <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 tracking-widest font-mono uppercase">
              Molecules Today. Possibilities Tomorrow.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 self-start md:self-auto text-xs font-mono">
          <div className="flex items-center space-x-2 bg-quantovia-charcoal/30 px-3 py-1.5 rounded-md border border-quantovia-charcoal/50">
            <span className="h-2 w-2 rounded-full bg-quantovia-teal"></span>
            <span className="text-slate-400">Target:</span>
            <span className="text-quantovia-pale-sage font-bold">EGFR (1M17)</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border ${getStatusStyles()}`}>
            <span className={`h-2 w-2 rounded-full ${getStatusDot()}`}></span>
            <span className="font-medium uppercase tracking-wider">{isMock ? 'DEMO MODE' : status}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

```


# src/components/PipelineStages.jsx
```jsx
import React from 'react';

// Status icons
function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-quantovia-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-5 w-5 text-quantovia-lime-sage" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4.5 w-4.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function ReadyIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function PipelineStages({ stages, currentStageIndex, isRunning, error }) {
  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-quantovia-teal"></span>
        Discovery Pipeline Stages
      </h2>

      <div className="relative pl-6 border-l-2 border-quantovia-charcoal space-y-6">
        {stages.map((stage, index) => {
          let status = 'locked'; // default for future states
          
          if (isRunning) {
            if (index < currentStageIndex) {
              status = 'done';
            } else if (index === currentStageIndex) {
              status = 'running';
            } else if (index === currentStageIndex + 1) {
              status = 'ready';
            }
          } else if (currentStageIndex >= stages.length) {
            status = 'done'; // Completed run
          } else if (!isRunning && currentStageIndex === -1 && index === 0) {
             status = 'ready'; // Very start of app
          }

          if (error && index === currentStageIndex) {
            status = 'error';
          }

          return (
            <div key={stage.id} className="relative group">
              {/* Connector dot indicator */}
              <div className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                status === 'done' 
                  ? 'bg-slate-950 border-quantovia-teal shadow-[0_0_8px_rgba(97,146,154,0.3)]' 
                  : status === 'running'
                    ? 'bg-slate-950 border-quantovia-lime-sage shadow-[0_0_8px_rgba(146,177,87,0.5)] animate-pulse'
                    : status === 'error'
                      ? 'bg-slate-950 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : 'bg-slate-950 border-quantovia-charcoal'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  status === 'done' 
                    ? 'bg-quantovia-teal' 
                    : status === 'running'
                      ? 'bg-quantovia-lime-sage'
                      : status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-quantovia-charcoal'
                }`} />
              </div>

              {/* Stage Card */}
              <div className={`p-3 rounded-lg border transition-all duration-300 ${
                status === 'running'
                  ? 'bg-quantovia-lime-sage/5 border-quantovia-lime-sage/20 shadow-md'
                  : status === 'done'
                    ? 'bg-quantovia-teal/5 border-quantovia-teal/10'
                    : status === 'error'
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-transparent border-transparent opacity-60'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-mono font-bold tracking-wider ${
                      status === 'running' 
                        ? 'text-quantovia-lime-sage' 
                        : status === 'done' 
                          ? 'text-quantovia-teal' 
                          : status === 'error'
                            ? 'text-rose-400'
                            : 'text-slate-500'
                    }`}>
                      0{index + 1}
                    </span>
                    <h3 className={`font-semibold text-sm ${
                      status === 'running' 
                        ? 'text-quantovia-lime-sage' 
                        : status === 'done' 
                          ? 'text-quantovia-off-white' 
                          : status === 'error'
                            ? 'text-rose-300'
                            : 'text-slate-400'
                    }`}>
                      {stage.label}
                    </h3>
                  </div>

                  {/* Status Icon */}
                  <div className="flex items-center">
                    {status === 'done' && <CheckIcon />}
                    {status === 'running' && <SpinnerIcon />}
                    {status === 'ready' && <ReadyIcon />}
                    {status === 'locked' && <LockIcon />}
                    {status === 'error' && <ErrorIcon />}
                  </div>
                </div>

                {stage.description && (
                  <p className={`text-xs mt-1 pl-5 ${status === 'running' ? 'text-quantovia-lime-sage/70' : 'text-slate-500'}`}>
                    {stage.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

```


# src/components/EmptyState.jsx
```jsx
import React from 'react';

export default function EmptyState() {
  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-8 shadow-xl flex flex-col justify-center items-center flex-1">
      {/* Visual Biotech Emblem */}
      <div className="h-20 w-20 bg-quantovia-deep-teal/10 border border-quantovia-deep-teal/30 rounded-full flex items-center justify-center text-quantovia-teal text-4xl mb-6 shadow-inner">
        ⬡
      </div>

      <h2 className="text-2xl font-bold text-quantovia-off-white tracking-tight">
        Discovery Pipeline Overview
      </h2>
      
      <p className="text-sm text-slate-400 mt-3 max-w-lg text-center leading-relaxed">
        This automated platform executes a complete *in silico* drug discovery pipeline targeting the Epidermal Growth Factor Receptor (EGFR). The process integrates generative chemistry (BRICS) with classical docking (AutoDock Vina) and prepares formulations for quantum optimization algorithms (QUBO/QAOA).
      </p>

      {/* Target Details Card */}
      <div className="w-full max-w-xl bg-slate-950/80 border border-quantovia-charcoal rounded-lg px-5 py-4 mt-8 text-left space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-quantovia-charcoal pb-2 mb-3">
          Pipeline Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs font-mono">
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">Target Protein</span>
            <span className="text-slate-300 font-bold">EGFR</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">PDB Structure</span>
            <span className="text-quantovia-teal font-bold">1M17</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">Generation</span>
            <span className="text-slate-300">BRICS Assembly</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
            <span className="text-slate-500">Docking</span>
            <span className="text-slate-300">AutoDock Vina</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded md:col-span-2">
            <span className="text-slate-500">Optimization Engine</span>
            <span className="text-quantovia-lime-sage">Qiskit QAOA Simulator</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-xs text-slate-500 font-mono text-center max-w-md">
        Click "Run Discovery Pipeline" on the left panel to initialize the screening process.
      </div>
    </div>
  );
}

```


# src/components/CandidateTable.jsx
```jsx
import React from 'react';
import { API_BASE_URL } from '../api/api';

export default function CandidateTable({ candidates, selectedCandidate, onSelectCandidate }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-8 text-center text-slate-500">
        No candidate data loaded. Start discovery to populate candidates.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl shadow-lg overflow-hidden">
      {/* Table Header Section */}
      <div className="px-5 py-4 border-b border-quantovia-charcoal bg-slate-900/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-quantovia-teal"></span>
            Screened Lead Candidates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Results ranked by multi-objective metrics and binding proxies.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium hidden sm:block bg-slate-800/55 px-2.5 py-1 rounded border border-quantovia-charcoal">
          💡 <span className="text-slate-300">Tip:</span> Lower binding scores indicate stronger predicted affinity.
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-quantovia-charcoal text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-14">Rank</th>
              <th className="py-3 px-4">Molecule (2D) / SMILES</th>
              <th className="py-3 px-4 text-right">Binding Score</th>
              <th className="py-3 px-4 text-right">Drug-likeness (QED)</th>
              <th className="py-3 px-4 text-right">Solubility (ESOL)</th>
              <th className="py-3 px-4 text-center">PAINS / Tox</th>
              <th className="py-3 px-4 text-right w-28">Classical Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-quantovia-charcoal/50 text-sm">
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
                  className={`cursor-pointer transition-colors hover:bg-slate-800/40 group ${
                    isSelected ? 'bg-slate-800/80 border-l-2 border-quantovia-teal' : 'bg-transparent'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs ${
                      rank === 1
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                        : rank === 2
                          ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20'
                          : 'text-slate-500'
                    }`}>
                      {rank}
                    </span>
                  </td>

                  {/* Molecule 2D / SMILES */}
                  <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                    <div className="flex items-center gap-3">
                      {/* Molecule Thumbnail */}
                      <div className="flex-shrink-0 w-16 h-16 bg-white rounded flex items-center justify-center overflow-hidden border border-quantovia-charcoal">
                        <img 
                          src={`${API_BASE_URL}/molecule/image?smiles=${encodeURIComponent(candidate.smiles)}`}
                          alt="2D Structure"
                          className="w-full h-full object-contain mix-blend-multiply"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-300">
                            COMP-{candidate.candidate_id.split('-')[0].toUpperCase()}
                          </span>
                          {candidate.quantum_selection_status && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-quantovia-lime-sage/10 text-quantovia-lime-sage border border-quantovia-lime-sage/30 animate-pulse">
                              ⚛️ Q-OPTIMIZED
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 truncate mt-1 hover:text-slate-400" title={candidate.smiles}>
                          {candidate.smiles}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Docking Score */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-quantovia-teal">
                    {bindingScore}
                  </td>

                  {/* Drug-likeness (QED) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    {candidate.properties?.qed?.toFixed(2) || 'N/A'}
                  </td>

                  {/* Solubility (ESOL) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    {candidate.properties?.esol?.toFixed(2) || 'N/A'}
                  </td>

                  {/* Toxicity Flags */}
                  <td className="py-3.5 px-4 text-center">
                    {!candidate.properties?.pains_flag ? (
                      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-quantovia-sage/10 text-quantovia-sage border border-quantovia-sage/20">
                        No Alerts
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ⚠ PAINS ({candidate.properties?.pains_alert_count})
                      </span>
                    )}
                  </td>

                  {/* Overall Score */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <span className="font-mono font-bold text-slate-200">
                        {candidate.classical_score ? candidate.classical_score.toFixed(3) : 'N/A'}
                      </span>
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            (candidate.classical_score || 0) >= 0.7 
                              ? 'bg-quantovia-teal' 
                              : (candidate.classical_score || 0) >= 0.5
                                ? 'bg-quantovia-lime-sage'
                                : 'bg-slate-500'
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

```


# src/components/MoleculeViewer.jsx
```jsx
import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';

export default function MoleculeViewer({ pdbId = "1M17" }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    setLoading(true);
    setError(null);
    
    let viewer = viewerRef.current;
    
    // If the viewer has not been initialized yet, create it.
    if (!viewer) {
      try {
        viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#020617' // slate-950
        });
        viewerRef.current = viewer;
      } catch (err) {
        console.error("Failed to initialize 3Dmol.js viewer:", err);
        setError("WebGL initialization failed. Make sure hardware acceleration is enabled.");
        setLoading(false);
        return;
      }
    }

    // Reset the viewer context
    viewer.clear();

    const targetUrl = pdbId.startsWith('pdb:') ? pdbId : `pdb:${pdbId}`;
    
    // Load structure via 3Dmol's built-in download tool
    $3Dmol.download(targetUrl, viewer, {
      multimodel: true,
      frames: true
    }, () => {
      try {
        // Apply scientific style (cartoon representation colored by spectrum)
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        viewer.zoomTo();
        viewer.render();
        setLoading(false);
      } catch (styleErr) {
        console.error("Error styling structure:", styleErr);
        setError("Error rendering structure style.");
        setLoading(false);
      }
    }, (downloadErr) => {
      console.error("Error downloading PDB from RCSB:", downloadErr);
      setError(`Failed to retrieve structure '${pdbId}' from RCSB PDB database.`);
      setLoading(false);
    });

    // Resize listener
    const resizeObserver = new ResizeObserver(() => {
      if (viewer) {
        viewer.resize();
        viewer.render();
      }
    });
    
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [pdbId]);

  // Visual helper functions
  const handleToggleSpin = () => {
    if (viewerRef.current) {
      const isSpinning = viewerRef.current.getSpin && viewerRef.current.getSpin();
      if (isSpinning) {
        viewerRef.current.spin(false);
      } else {
        viewerRef.current.spin(true);
      }
    }
  };

  const handleRecenter = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            3D Molecular Visualization
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active structure: <span className="font-mono text-cyan-400 font-bold">{pdbId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRecenter}
            disabled={loading || error}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] font-medium text-slate-300 rounded border border-slate-700 transition"
            title="Recenter Camera"
          >
            Recenter
          </button>
          <button
            onClick={handleToggleSpin}
            disabled={loading || error}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] font-medium text-slate-300 rounded border border-slate-700 transition"
            title="Toggle Spin"
          >
            Spin
          </button>
        </div>
      </div>

      {/* Render Area */}
      <div className="relative flex-1 min-h-[300px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
            <svg className="animate-spin h-8 w-8 text-cyan-400 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-slate-400 font-mono">Loading pdb:{pdbId} from RCSB...</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-10">
            <span className="text-rose-400 text-2xl mb-2">⚠</span>
            <p className="text-sm font-semibold text-slate-300">Visualization Unavailable</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[250px]">{error}</p>
          </div>
        )}

        {/* 3Dmol Target Container */}
        <div 
          ref={containerRef} 
          className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" 
        />
      </div>

      <div className="mt-2 text-[10px] text-slate-500 leading-normal flex items-start gap-1">
        <span>💡</span>
        <span>Drag mouse to rotate, scroll to zoom, right-click/ctrl-drag to translate.</span>
      </div>
    </div>
  );
}

```


# src/components/StageViews/TargetOverview.jsx
```jsx
import React from 'react';

export default function TargetOverview({ target }) {
  if (!target) return null;
  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg mb-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        🎯 Target Overview
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Target</span>
          <div className="text-quantovia-off-white font-mono text-sm">{target.name}</div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">PDB Structure</span>
          <div className="text-quantovia-teal font-mono text-sm font-bold">{target.pdb}</div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Data Source</span>
          <div className="text-quantovia-off-white font-mono text-sm">{target.source}</div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Mode</span>
          <div className="text-quantovia-off-white font-mono text-xs leading-tight">{target.mode}</div>
        </div>
      </div>
    </div>
  );
}

```


# src/components/StageViews/RunHistory.jsx
```jsx
import React from 'react';

export default function RunHistory() {
  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg flex flex-col h-48 mt-6">
      <div className="flex items-center justify-between mb-3 border-b border-quantovia-charcoal pb-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          🕒 Run History
        </h3>
      </div>
      <div className="flex-1 flex items-center justify-center text-[10px] text-slate-500 font-mono text-center">
        No previous pipeline runs found in the current session.
      </div>
    </div>
  );
}

```


# src/components/StageViews/PipelineSummary.jsx
```jsx
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

```


# src/components/StageViews/LivePipeline.jsx
```jsx
import React, { useState } from 'react';

export default function LivePipeline({ stages, onStageClick, activeStageIndex }) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg mb-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        ⏳ Live Pipeline Timeline
      </h2>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {stages.map((stage, idx) => {
          const isCompleted = stage.status === 'COMPLETED' || stage.status === 'COMPLETED_WITH_FALLBACK';
          const isFailed = stage.status === 'FAILED';
          const isRunning = stage.status === 'RUNNING';
          const isPending = stage.status === 'PENDING';
          const isActive = activeStageIndex === idx;

          let statusIcon = '○';
          let textColor = 'text-slate-500';
          if (isCompleted) {
            statusIcon = '✓';
            textColor = 'text-quantovia-teal';
          } else if (isFailed) {
            statusIcon = '⚠';
            textColor = 'text-rose-400';
          } else if (isRunning) {
            statusIcon = '◉';
            textColor = 'text-quantovia-lime-sage animate-pulse';
          }

          if (stage.status === 'COMPLETED_WITH_FALLBACK') {
             textColor = 'text-amber-400';
          }

          return (
            <div 
              key={idx} 
              onClick={() => onStageClick(idx)}
              className={`flex-1 min-w-[120px] flex flex-col items-center text-center cursor-pointer p-2 rounded transition-colors ${isActive ? 'bg-white/5 border border-quantovia-charcoal' : 'hover:bg-white/5'}`}
            >
              <div className={`text-xl mb-1 ${textColor}`}>{statusIcon}</div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                {stage.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                {stage.message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

```


# src/components/StageViews/StageDetails.jsx
```jsx
import React from 'react';

export default function StageDetails({ stage, candidates, quantum }) {
  if (!stage) return null;

  const renderDetails = () => {
    switch (stage.name) {
      case 'Target Validation':
        return (
          <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">PDB</span>
                <div className="text-quantovia-teal font-mono text-sm">{stage.details?.pdb}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Input Ligands</span>
                <div className="text-quantovia-off-white font-mono text-sm">{stage.details?.num_ligands} known binders</div>
             </div>
          </div>
        );
      case 'Molecular Generation':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Method</span>
                <div className="text-quantovia-off-white font-mono text-sm">{stage.details?.method}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Raw Generated</span>
                <div className="text-quantovia-off-white font-mono text-sm">{stage.details?.generated}</div>
             </div>
          </div>
        );
      case 'Molecular Properties':
        return (
          <div className="text-slate-300 text-sm">
             <p>{stage.details?.passed} candidates passed ADMET/QED and MW filters.</p>
          </div>
        );
      case 'Docking Simulation':
        return (
           <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Successful (Vina)</span>
                <div className="text-quantovia-teal font-mono text-sm">{stage.details?.successful}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Fallback (Tanimoto)</span>
                <div className="text-amber-400 font-mono text-sm">{stage.details?.fallback_used}</div>
             </div>
          </div>
        );
      case 'Classical Ranking':
        return (
           <div className="text-slate-300 text-sm">
             <p>Top {stage.details?.top_candidates} candidates ranked using multi-objective scoring:</p>
             <ul className="list-disc ml-5 mt-2 text-slate-400 font-mono text-xs">
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
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-2">QAOA Objective Value</span>
                <div className="text-cyan-400 font-mono text-xl">{quantum?.objective_value?.toFixed(4) || 'N/A'}</div>
                <div className="text-[10px] text-slate-500 mt-1">Backend: {quantum?.backend}</div>
                <div className="text-[10px] text-rose-400 mt-1 italic">{quantum?.limitations}</div>
             </div>
             <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-2">Selected Candidates</span>
                <div className="flex flex-wrap gap-2">
                   {quantum?.selected_candidates?.map(c => (
                      <span key={c} className="px-2 py-1 bg-cyan-900/30 border border-cyan-700/50 text-cyan-300 rounded font-mono text-xs">✓ {c}</span>
                   ))}
                </div>
             </div>
           </div>
        );
      case 'AI Explanation':
         return (
            <div className="text-slate-300 text-sm">
              <p>Clinical explanations are generated based on true computational properties. <strong>These findings represent purely computational hypotheses and require experimental validation.</strong></p>
            </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-quantovia-charcoal rounded-xl p-5 shadow-lg mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4 border-b border-quantovia-charcoal pb-2">
         <h3 className="text-xs font-semibold text-quantovia-teal uppercase tracking-wider">
           Stage Detail: {stage.name}
         </h3>
         <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            stage.status === 'COMPLETED' ? 'bg-quantovia-teal/10 text-quantovia-teal border-quantovia-teal/30' :
            stage.status === 'COMPLETED_WITH_FALLBACK' ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' :
            stage.status === 'FAILED' ? 'bg-rose-400/10 text-rose-400 border-rose-400/30' :
            'bg-slate-700/30 text-slate-400 border-slate-600/30'
         }`}>
           {stage.status}
         </span>
      </div>
      <div>
         <p className="text-xs text-slate-400 mb-4">{stage.message}</p>
         {renderDetails()}
      </div>
    </div>
  );
}

```


# src/api/mockData.js
```javascript
export const mockCandidates = [
  {
    id: "c1",
    smiles: "CCOc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN1CCOCC1", // Gefitinib structure (active EGFR inhibitor)
    qed: 0.78,
    esol: -3.2,
    tox_flags: [],
    docking_score: -9.4,
    quantum_selected: true,
    rank: 1,
    overall_score: 91.4
  },
  {
    id: "c2",
    smiles: "CS(=O)(=O)CCNCC1OCCC1c2ccc(Oc3ccc4ncnc(Nc5ccc(Cl)c(Cl)c5)c4c3)o2", // Lapatinib-like structure
    qed: 0.65,
    esol: -4.1,
    tox_flags: ["High MW"],
    docking_score: -8.9,
    quantum_selected: false,
    rank: 2,
    overall_score: 85.2
  },
  {
    id: "c3",
    smiles: "CN(C)CC=CC(=O)Nc1cc2c(cc1Oc3ccc(F)c(Cl)c3)ncnc2N4CCOCC4", // Afatinib-like structure
    qed: 0.72,
    esol: -3.5,
    tox_flags: [],
    docking_score: -8.5,
    quantum_selected: false,
    rank: 3,
    overall_score: 78.9
  },
  {
    id: "c4",
    smiles: "COc1cc(N2CCN(C)CC2)c(NC(=O)C=C)cc1Nc3nccc(n3)c4cn(C)c5ccccc45", // Osimertinib-like structure
    qed: 0.61,
    esol: -4.8,
    tox_flags: ["Hepatotoxicity risk"],
    docking_score: -8.1,
    quantum_selected: false,
    rank: 4,
    overall_score: 72.6
  },
  {
    id: "c5",
    smiles: "CC(C)Oc1cc2ncnc(Nc3ccc(Br)cc3F)c2cc1OCCCN4CCOCC4", // Erlotinib derivative
    qed: 0.81,
    esol: -2.9,
    tox_flags: ["Mutagenic potential"],
    docking_score: -7.8,
    quantum_selected: false,
    rank: 5,
    overall_score: 68.1
  }
];

export const mockPipelineStages = [
  { id: "target", label: "Target", description: "EGFR receptor • PDB 1M17" },
  { id: "generation", label: "Molecular Generation", description: "BRICS fragment-based generation" },
  { id: "properties", label: "Molecular Properties", description: "QED • ESOL • PAINS" },
  { id: "docking", label: "Docking", description: "AutoDock Vina / Tanimoto similarity proxy" },
  { id: "ranking", label: "Classical Ranking", description: "Multi-objective prioritization" },
  { id: "quantum", label: "Quantum Optimization", description: "QUBO + QAOA" },
  { id: "explanation", label: "AI Explanation", description: "Candidate analysis" }
];

```


# src/api/api.js
```javascript
import { mockCandidates } from './mockData';

// Global flag to toggle between mock data and the live FastAPI backend
export const USE_MOCK = false;

// Centralized Backend URL
export const API_BASE_URL = "http://localhost:8000";

/**
 * Fetch candidate molecules for the drug discovery target.
 */
export async function getCandidates() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockCandidates;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/candidates`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server Error ${response.status}: ${errText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching candidates from FastAPI backend:", error);
    throw new Error(error.message || "Unable to connect to discovery backend.");
  }
}

/**
 * Fetch a specific candidate with explanation
 */
export async function getCandidateDetails(candidateId) {
  if (USE_MOCK) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }
    return await response.json();
  } catch (err) {
    throw new Error(`Explanation Failed: ${err.message || 'Network error'}`);
  }
}

/**
 * Trigger pipeline run (returns DetailedPipelineResponse)
 */
export async function runPipeline() {
  if (USE_MOCK) return { status: "READY" };
  try {
    const response = await fetch(`${API_BASE_URL}/pipeline/run`, { method: "POST" });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pipeline API returned HTTP ${response.status}: ${errText}`);
    }
    return await response.json();
  } catch (err) {
    throw new Error(err.message || "Network error while starting pipeline.");
  }
}

/**
 * Fetch Quantum Results
 */
export async function getQuantumResults() {
  if (USE_MOCK) return null;
  const response = await fetch(`${API_BASE_URL}/quantum/result`);
  if (!response.ok) throw new Error("Failed to fetch quantum results.");
  return await response.json();
}

```
