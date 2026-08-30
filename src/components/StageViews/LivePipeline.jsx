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
