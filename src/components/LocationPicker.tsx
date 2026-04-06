"use client";

import React, { useState } from 'react';

import { LOCATIONS_DATA } from '@/data/locations';

interface LocationPickerProps {
  onLocationChange?: (state: string, lga: string) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationChange }) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Where are you?</h2>
        <p className="text-gray-500 mt-2">Find the best deals in your immediate vicinity.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Select State</label>
          <select 
            className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-green-500 rounded-2xl p-4 text-gray-900 transition-all appearance-none"
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(''); }}
          >
            <option value="">Select a State</option>
            {Object.keys(LOCATIONS_DATA).map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Select LGA</label>
          <select 
            className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-green-500 rounded-2xl p-4 text-gray-900 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedLga}
            onChange={(e) => setSelectedLga(e.target.value)}
            disabled={!selectedState}
          >
            <option value="">{selectedState ? "Select an LGA" : "Pick a state first..."}</option>
            {selectedState && LOCATIONS_DATA[selectedState].map(lga => (
              <option key={lga} value={lga}>{lga}</option>
            ))}
          </select>
        </div>

        <button 
          disabled={!selectedLga}
          onClick={() => onLocationChange?.(selectedState, selectedLga)}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-5 rounded-2xl shadow-xl shadow-green-200 transition-all active:scale-[0.98] uppercase tracking-widest"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LocationPicker;
