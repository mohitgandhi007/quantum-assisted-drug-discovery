import React from 'react';

export default function EmptyState() {
  return (
    <div className="bg-surface-100 border border-surface-200 rounded-2xl p-10 shadow-sm flex flex-col justify-center items-center flex-1">
      {/* Visual Biotech Emblem */}
      <div className="mb-8">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="29" stroke="#E9ECE6" strokeWidth="2"/>
          <path d="M30 15L43 22.5L43 37.5L30 45L17 37.5L17 22.5L30 15Z" stroke="#7BA193" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="30" cy="30" r="4" fill="#5F8F88"/>
          <path d="M30 15V26" stroke="#7BA193" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M17 37.5L26 32.5" stroke="#7BA193" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M43 37.5L34 32.5" stroke="#7BA193" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 className="text-3xl font-serif font-bold text-quantovia-charcoal tracking-tight">
        Computational Discovery, Reimagined.
      </h2>
      
      <p className="text-[15px] text-quantovia-sage mt-4 max-w-lg text-center leading-relaxed font-sans">
        Quantovia automates the <em>in silico</em> drug discovery pipeline targeting the Epidermal Growth Factor Receptor (EGFR). Integrating generative fragment assembly with classical docking and quantum optimization.
      </p>

      {/* Target Details Card */}
      <div className="w-full max-w-xl bg-surface-200/50 border border-surface-200 rounded-xl px-6 py-5 mt-10 text-left space-y-4">
        <h3 className="text-xs font-semibold text-quantovia-sage uppercase tracking-wider border-b border-surface-300 pb-3 mb-4">
          Pipeline Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm font-sans">
          <div className="flex justify-between items-center border-b border-surface-300/50 pb-2">
            <span className="text-quantovia-sage">Target Protein</span>
            <span className="text-quantovia-charcoal font-semibold">EGFR</span>
          </div>
          <div className="flex justify-between items-center border-b border-surface-300/50 pb-2">
            <span className="text-quantovia-sage">PDB Structure</span>
            <span className="text-quantovia-deep-teal font-semibold">1M17</span>
          </div>
          <div className="flex justify-between items-center border-b border-surface-300/50 pb-2">
            <span className="text-quantovia-sage">Generation</span>
            <span className="text-quantovia-charcoal">BRICS Assembly</span>
          </div>
          <div className="flex justify-between items-center border-b border-surface-300/50 pb-2">
            <span className="text-quantovia-sage">Docking</span>
            <span className="text-quantovia-charcoal">AutoDock Vina</span>
          </div>
          <div className="flex justify-between items-center md:col-span-2 pt-1">
            <span className="text-quantovia-sage">Optimization Engine</span>
            <span className="text-quantovia-forest font-medium bg-surface-300 px-2.5 py-1 rounded-md text-xs">Qiskit QAOA Simulator</span>
          </div>
        </div>
      </div>

      <div className="mt-10 text-xs text-quantovia-sage font-sans text-center max-w-md">
        Click <strong className="text-quantovia-charcoal">Run Discovery Pipeline</strong> to initialize the screening process.
      </div>
    </div>
  );
}
