import React from 'react';

/**
 * API Config Display Component
 * Shows the current API configuration for debugging
 */
export const APIConfigDisplay: React.FC = () => {
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'NOT SET';
  const mode = import.meta.env.MODE;
  const isDev = import.meta.env.DEV;
  
  return (
    <div className="fixed bottom-20 right-4 bg-blue-900 text-white p-3 rounded text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-1">🔧 API Config</div>
      <div>Base URL: <span className="text-yellow-300">{apiBaseURL}</span></div>
      <div>Mode: {mode}</div>
      <div>Dev: {isDev ? 'Yes' : 'No'}</div>
    </div>
  );
};
