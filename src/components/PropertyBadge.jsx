import React from 'react';

export default function PropertyBadge({ type, value }) {
  if (type === 'toxicity') {
    const flags = Array.isArray(value) ? value : [];
    if (flags.length === 0) {
      return (
        <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 select-none">
          ✓ No Flags
        </span>
      );
    }
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {flags.map((flag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25 select-none animate-pulse"
          >
            ⚠ {flag}
          </span>
        ))}
      </div>
    );
  }

  if (type === 'qed') {
    const qedVal = typeof value === 'number' ? value : parseFloat(value) || 0;
    // Highlight if QED is exceptionally high (> 0.75 is generally considered good drug-likeness)
    const isGood = qedVal >= 0.70;
    return (
      <span className={`inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded border ${
        isGood 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}>
        {qedVal.toFixed(2)}
      </span>
    );
  }

  if (type === 'esol') {
    const esolVal = typeof value === 'number' ? value : parseFloat(value) || 0;
    // ESOL: > -4.0 is generally considered highly soluble. < -6.0 is poorly soluble.
    const isGood = esolVal >= -4.0;
    const isBad = esolVal < -6.0;
    return (
      <span className={`inline-flex items-center font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
        isGood 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : isBad 
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
            : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}>
        {esolVal.toFixed(1)}
      </span>
    );
  }

  return (
    <span className="font-mono text-xs text-slate-300">
      {String(value)}
    </span>
  );
}
