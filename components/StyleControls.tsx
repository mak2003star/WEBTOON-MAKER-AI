
import React from 'react';
import type { BubbleSize } from '../App';
import type { ArtStyle } from '../types';

interface StyleControlsProps {
  selectedSize: BubbleSize;
  onSizeChange: (size: BubbleSize) => void;
  selectedStyle: ArtStyle;
  onStyleChange: (style: ArtStyle) => void;
}

const StyleControls: React.FC<StyleControlsProps> = ({ selectedSize, onSizeChange, selectedStyle, onStyleChange }) => {
  const sizes: { value: BubbleSize; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  const styles: { value: ArtStyle; label: string; desc: string }[] = [
    { value: 'modern_action', label: 'Modern Action', desc: 'Sharp, high-contrast, glowing effects (Solo Leveling style).' },
    { value: 'romance', label: 'Romance', desc: 'Soft, pastel, dreamy, detailed eyes (True Beauty style).' },
    { value: 'fantasy', label: 'Epic Fantasy', desc: 'Detailed backgrounds, magical, painterly.' },
    { value: 'horror', label: 'Dark Thriller', desc: 'Gritty, shadows, muted colors, intense.' },
    { value: 'slice_of_life', label: 'Slice of Life', desc: 'Clean lines, bright colors, simple.' },
    { value: 'mature', label: 'Mature (NSFW)', desc: 'Adult Manhwa (Seinen). Gritty, realistic, high tension.' },
  ];

  return (
    <div className="space-y-6">
        {/* Art Style Selection */}
        <div className="bg-gray-800/50 rounded-lg p-6 shadow-md border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">AI Art Model</h2>
            <div className="space-y-3">
                {styles.map((style) => (
                    <button
                        key={style.value}
                        onClick={() => onStyleChange(style.value)}
                        className={`w-full p-3 text-left rounded-lg border transition-all duration-200 flex flex-col gap-1 ${
                            selectedStyle === style.value
                                ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                        }`}
                    >
                        <span className={`font-bold ${selectedStyle === style.value ? 'text-purple-300' : 'text-gray-300'}`}>
                            {style.label}
                        </span>
                        <span className="text-xs text-gray-400">
                            {style.desc}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Bubble Size Selection */}
        <div className="bg-gray-800/50 rounded-lg p-6 shadow-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Text Options</h2>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">Bubble Size</label>
                <div className="flex items-center space-x-2 rounded-md bg-gray-700/50 p-1">
                {sizes.map(({ value, label }) => (
                    <button
                    key={value}
                    onClick={() => onSizeChange(value)}
                    className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                        selectedSize === value
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-transparent text-gray-300 hover:bg-gray-600/50'
                    }`}
                    aria-pressed={selectedSize === value}
                    >
                    {label}
                    </button>
                ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StyleControls;
