import React from 'react';

export default function Header({ isMock, status = 'READY' }) {
  // status: 'READY', 'RUNNING', 'COMPLETED', 'ERROR'
  
  const getStatusStyles = () => {
    if (isMock) return 'bg-amber-100 border-amber-200 text-amber-700';
    switch (status) {
      case 'RUNNING': return 'bg-quantovia-lime-sage/20 border-quantovia-lime-sage/40 text-quantovia-charcoal';
      case 'COMPLETED': return 'bg-quantovia-teal/20 border-quantovia-teal/40 text-quantovia-forest';
      case 'ERROR': return 'bg-rose-100 border-rose-200 text-rose-700';
      case 'READY':
      default:
        return 'bg-surface-200 border-surface-300 text-quantovia-sage';
    }
  };

  const getStatusDot = () => {
    if (isMock) return 'bg-amber-500';
    switch (status) {
      case 'RUNNING': return 'bg-quantovia-lime-sage animate-pulse';
      case 'COMPLETED': return 'bg-quantovia-teal';
      case 'ERROR': return 'bg-rose-500';
      case 'READY':
      default:
        return 'bg-quantovia-pale-sage';
    }
  };

  return (
    <header className="border-b border-surface-300 bg-surface-100/90 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title and Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-surface-200 border border-surface-300 flex items-center justify-center text-quantovia-teal font-serif italic font-bold text-xl">
            Q
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-semibold text-quantovia-charcoal tracking-tight flex items-center gap-2">
              Quantovia
              <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-surface-200 text-quantovia-sage border border-surface-300">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] md:text-xs text-quantovia-sage mt-0.5 font-sans">
              Computational Discovery Pipeline
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 self-start md:self-auto text-xs font-sans">
          <div className="flex items-center space-x-2 bg-surface-100 px-3 py-1.5 rounded-md border border-surface-300 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-quantovia-teal"></span>
            <span className="text-quantovia-sage">Target:</span>
            <span className="text-quantovia-charcoal font-semibold">EGFR (1M17)</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border shadow-sm ${getStatusStyles()}`}>
            <span className={`h-2 w-2 rounded-full ${getStatusDot()}`}></span>
            <span className="font-medium uppercase tracking-wider text-[10px]">{isMock ? 'DEMO MODE' : status}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
