import React, { useState } from 'react';

export default function LivePipeline({ stages, onStageClick, activeStageIndex }) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="bg-surface-100 border border-surface-300 rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-sm font-semibold text-quantovia-sage uppercase tracking-wider mb-4 flex items-center gap-2">
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
          let textColor = 'text-quantovia-sage';
          if (isCompleted) {
            statusIcon = '✓';
            textColor = 'text-quantovia-teal';
          } else if (isFailed) {
            statusIcon = '⚠';
            textColor = 'text-rose-600';
          } else if (isRunning) {
            statusIcon = '◉';
            textColor = 'text-quantovia-forest animate-pulse';
          }

          if (stage.status === 'COMPLETED_WITH_FALLBACK') {
             textColor = 'text-amber-600';
          }

          return (
            <div 
              key={idx} 
              onClick={() => onStageClick(idx)}
              className={`flex-1 min-w-[120px] flex flex-col items-center text-center cursor-pointer p-3 rounded-lg transition-colors ${isActive ? 'bg-surface-200 border border-surface-300 shadow-inner' : 'hover:bg-surface-200'}`}
            >
              <div className={`text-xl mb-1 ${textColor}`}>{statusIcon}</div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                {stage.name}
              </div>
              <div className="text-[10px] text-quantovia-sage mt-1 line-clamp-2">
                {stage.message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
