import React from 'react';

export default function Disclaimer() {
  return (
    <div className="bg-slate-900/60 border-t border-slate-800/80 px-6 py-4 text-center">
      <p className="text-[11px] text-slate-500 max-w-4xl mx-auto leading-relaxed font-mono">
        💡 <span className="font-semibold text-slate-400">Scientific Disclaimer:</span> This platform is for computational research and educational purposes. Predictions are not clinical recommendations and do not constitute evidence of safety or efficacy. Any candidate requires rigorous computational, laboratory, preclinical, and clinical validation.
      </p>
    </div>
  );
}
