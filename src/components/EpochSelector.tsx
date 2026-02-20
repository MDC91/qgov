'use client';

import { useState, useEffect } from 'react';

interface EpochSelectorProps {
  epochs: { epoch: number; proposalCount: number; hasActive: boolean }[];
  selectedEpoch: number;
  onSelect: (epoch: number) => void;
}

export default function EpochSelector({ epochs, selectedEpoch, onSelect }: EpochSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm" style={{ color: '#94a3b8' }}>Epoch:</label>
      <select
        value={selectedEpoch}
        onChange={(e) => onSelect(parseInt(e.target.value, 10))}
        className="rounded-lg px-4 py-2 focus:outline-none focus:ring-2"
        style={{ 
          backgroundColor: '#151e27', 
          border: '1px solid #202e3c',
          color: '#ffffff'
        }}
      >
        {epochs.map((e) => (
          <option key={e.epoch} value={e.epoch} style={{ backgroundColor: '#151e27' }}>
            Epoch {e.epoch} ({e.proposalCount} proposals{e.hasActive ? ' • Active' : ''})
          </option>
        ))}
      </select>
    </div>
  );
}
