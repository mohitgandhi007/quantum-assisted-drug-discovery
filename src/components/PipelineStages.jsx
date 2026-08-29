import React from 'react';

// Status icons
function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4.5 w-4.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export default function PipelineStages({ stages, currentStageIndex, isRunning }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
        Discovery Pipeline Stages
      </h2>

      <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
        {stages.map((stage, index) => {
          let status = 'pending';
          if (isRunning) {
            if (index < currentStageIndex) {
              status = 'done';
            } else if (index === currentStageIndex) {
              status = 'running';
            }
          } else if (currentStageIndex >= stages.length) {
            status = 'done'; // Completed run
          }

          return (
            <div key={stage.id} className="relative group">
              {/* Connector dot indicator */}
              <div className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                status === 'done' 
                  ? 'bg-slate-950 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : status === 'running'
                    ? 'bg-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse'
                    : 'bg-slate-950 border-slate-700'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  status === 'done' 
                    ? 'bg-emerald-400' 
                    : status === 'running'
                      ? 'bg-cyan-400'
                      : 'bg-slate-700'
                }`} />
              </div>

              {/* Stage Card */}
              <div className={`p-3 rounded-lg border transition-all duration-300 ${
                status === 'running'
                  ? 'bg-cyan-500/5 border-cyan-500/20 shadow-md'
                  : status === 'done'
                    ? 'bg-emerald-500/[0.01] border-slate-800/80'
                    : 'bg-transparent border-transparent opacity-60'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-mono font-bold tracking-wider ${
                      status === 'running' 
                        ? 'text-cyan-400' 
                        : status === 'done' 
                          ? 'text-emerald-400' 
                          : 'text-slate-500'
                    }`}>
                      0{index + 1}
                    </span>
                    <h3 className={`font-semibold text-sm ${
                      status === 'running' 
                        ? 'text-cyan-300' 
                        : status === 'done' 
                          ? 'text-slate-200' 
                          : 'text-slate-400'
                    }`}>
                      {stage.label}
                    </h3>
                  </div>

                  {/* Status Icon */}
                  <div className="flex items-center">
                    {status === 'done' && <CheckIcon />}
                    {status === 'running' && <SpinnerIcon />}
                    {status === 'pending' && <LockIcon />}
                  </div>
                </div>

                {stage.description && (
                  <p className="text-xs text-slate-500 mt-1 pl-5">
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
