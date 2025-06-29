
import React, { useState } from 'react';

interface LocationSearchProps {
  onSearch: (searchTerm: string) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onSearch }) => {
  const [term, setTerm] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
      <label htmlFor="location-search" className="block text-sm font-medium text-sky-400 mb-1">
        Search Location
      </label>
      <div className="flex">
        <input
          id="location-search"
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Enter address, landmark, or 'lat, lon'"
          className="flex-grow bg-gray-700 border border-gray-600 text-gray-100 rounded-l-md p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
        />
        <button
          type="submit"
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold p-3 rounded-r-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">Tip: Click on the map to select a precise location.</p>
    </form>
  );
};
