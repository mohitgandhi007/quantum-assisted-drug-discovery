import React from 'react';

export default function RunHistory() {
  return (
    <div className="bg-surface-100 border border-surface-300 rounded-xl p-5 shadow-sm flex flex-col h-48 mt-6">
      <div className="flex items-center justify-between mb-3 border-b border-surface-300 pb-2">
        <h3 className="text-xs font-semibold text-quantovia-sage uppercase tracking-wider flex items-center gap-1.5">
          🕒 Run History
        </h3>
      </div>
      <div className="flex-1 flex items-center justify-center text-[10px] text-quantovia-sage font-mono text-center">
        No previous pipeline runs found in the current session.
      </div>
    </div>
  );
}
