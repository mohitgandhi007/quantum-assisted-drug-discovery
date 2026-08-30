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
