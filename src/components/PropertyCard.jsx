import React from 'react';

export default function PropertyCard({ label, value, explanation, unit = "" }) {
  // Gracefully handle missing, null, or undefined values
  const hasValue = value !== undefined && value !== null && value !== "";
  const formattedValue = hasValue ? `${value}${unit ? ` ${unit}` : ""}` : "Not available";

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700/80 transition-all select-none">
      <div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          {label}
        </span>
        <span className={`text-sm md:text-base font-mono font-bold mt-1 block truncate ${
          hasValue ? 'text-slate-200' : 'text-slate-500 italic font-normal text-xs'
        }`}>
          {formattedValue}
        </span>
      </div>
      {explanation && (
        <span className="text-[10px] text-slate-500 mt-2 border-t border-slate-900 pt-1 block">
          {explanation}
        </span>
      )}
    </div>
  );
}
