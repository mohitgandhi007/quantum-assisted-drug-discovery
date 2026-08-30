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
