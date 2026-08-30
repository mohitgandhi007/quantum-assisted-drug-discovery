import React, { useState } from 'react';
import { API_BASE_URL } from '../api/api';

export default function MoleculeImage({ smiles, id }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Construct the URL using the centralized base URL
  const imageUrl = `${API_BASE_URL}/api/molecule/image?smiles=${encodeURIComponent(smiles)}`;

  return (
    <div className="relative w-16 h-16 bg-white rounded border border-slate-700/50 flex items-center justify-center overflow-hidden shadow-inner select-none">
      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-cyan-500 animate-spin" />
        </div>
      )}

      {/* Error Fallback */}
      {error ? (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-1 text-center" title="Image failed to load">
          <span className="text-[10px] font-mono font-bold text-slate-500">NO IMG</span>
          <span className="text-[8px] text-slate-600 font-mono overflow-hidden max-w-full truncate">{id}</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={`Structure ${id}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          className={`w-full h-full object-contain p-1 transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
}
