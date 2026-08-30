import React from 'react';

export default function Header({ isMock }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title and Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg shadow-inner">
            D
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Drug Discovery AI
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0-Hackathon
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Generative Lead Optimization &amp; Quantum Affinity Selection for EGFR Target
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 self-start md:self-auto text-xs">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Target:</span>
            <span className="text-cyan-400 font-mono">EGFR (1M17)</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border ${
            isMock 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isMock ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span className="font-medium">Mode:</span>
            <span className="font-mono uppercase">{isMock ? 'Mock API' : 'Live Backend'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
