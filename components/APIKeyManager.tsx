import React from 'react';
import InfoIcon from './icons/InfoIcon';

const APIKeyManager: React.FC = () => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 shadow-md border border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 text-gray-200">API Key</h2>
      <div className="relative">
        <label htmlFor="api-key-display" className="block text-sm font-medium text-gray-400 mb-1">
          Gemini API Key
        </label>
        <input
          id="api-key-display"
          type="text"
          value="•••••••••••••••••••••••••••••••••••"
          className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none transition-shadow duration-200 cursor-not-allowed text-gray-500"
          disabled
          aria-describedby="api-key-info"
        />
        <div className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 group">
          <InfoIcon className="h-5 w-5 text-gray-400" />
          <div 
            id="api-key-info"
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-gray-200 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-600 z-10"
            role="tooltip"
          >
            The API key is securely loaded from your environment variables (API_KEY) for security and cannot be changed in the app.
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeyManager;