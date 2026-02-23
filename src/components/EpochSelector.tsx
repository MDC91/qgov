'use client';

import { useState, useEffect } from 'react';

interface EpochSelectorProps {
  epochs: { epoch: number; proposalCount: number; hasActive: boolean }[];
  selectedEpoch: number;
  onSelect: (epoch: number) => void;
}

export default function EpochSelector({ epochs, selectedEpoch, onSelect }: EpochSelectorProps) {
  const [inputValue, setInputValue] = useState(selectedEpoch.toString());

  useEffect(() => {
    setInputValue(selectedEpoch.toString());
  }, [selectedEpoch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const epoch = parseInt(inputValue, 10);
    if (epochs.some(e => e.epoch === epoch)) {
      onSelect(epoch);
    }
  };

  const goToEpoch = (delta: number) => {
    const currentIndex = epochs.findIndex(e => e.epoch === selectedEpoch);
    if (currentIndex >= 0 && currentIndex + delta >= 0 && currentIndex + delta < epochs.length) {
      onSelect(epochs[currentIndex + delta].epoch);
    }
  };

  const currentEpochData = epochs.find(e => e.epoch === selectedEpoch);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label className="text-sm" style={{ color: '#94a3b8' }}>Epoch:</label>
      <div className="flex items-center rounded-lg" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
        <button
          type="button"
          onClick={() => goToEpoch(-1)}
          className="px-2 py-2 hover:bg-opacity-30 transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSubmit}
          className="w-16 text-center bg-transparent focus:outline-none"
          style={{ color: '#ffffff', border: 'none' }}
        />
        <button
          type="button"
          onClick={() => goToEpoch(1)}
          className="px-2 py-2 hover:bg-opacity-30 transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {currentEpochData && (
        <span className="text-sm" style={{ color: '#94a3b8' }}>
          ({currentEpochData.proposalCount} proposals{currentEpochData.hasActive ? ' • Active' : ''})
        </span>
      )}
    </form>
  );
}
