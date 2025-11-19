import React, { useState, useRef } from 'react';
import MagicIcon from './icons/MagicIcon';
import type { Character } from '../types';

interface StorylineReviewProps {
    storyline: string[];
    characters: Character[];
    existingCharacters: Character[]; // Characters from previous chapters for gallery
    onStorylineUpdate: (index: number, newPrompt: string) => void;
    onCharacterUpdate: (index: number, updatedChar: Character) => void;
    onGeneratePanels: (storyline: string[]) => void;
    onBack: () => void;
}

const StorylineReview: React.FC<StorylineReviewProps> = ({ 
    storyline, 
    characters, 
    existingCharacters,
    onStorylineUpdate, 
    onCharacterUpdate, 
    onGeneratePanels, 
    onBack 
}) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleGenerateClick = () => {
        onGeneratePanels(storyline);
    }

    const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                onCharacterUpdate(index, { ...characters[index], image: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileUpload = (index: number) => {
        fileInputRefs.current[index]?.click();
    };

    const removeImage = (index: number) => {
        const updatedChar = { ...characters[index] };
        delete updatedChar.image;
        onCharacterUpdate(index, updatedChar);
    };

    const openGallery = (index: number) => {
        setActiveCharIndex(index);
        setIsGalleryOpen(true);
    };

    const selectFromGallery = (char: Character) => {
        if (activeCharIndex !== null) {
            onCharacterUpdate(activeCharIndex, {
                ...characters[activeCharIndex],
                name: char.name,
                description: char.description,
                image: char.image
            });
            setIsGalleryOpen(false);
            setActiveCharIndex(null);
        }
    };
    
    return (
        <div className="bg-gray-800/50 rounded-xl p-6 shadow-xl border border-gray-700 space-y-8 relative">
            
            {/* Gallery Modal */}
            {isGalleryOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-white">Character Gallery</h3>
                            <button onClick={() => setIsGalleryOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                            {existingCharacters.length === 0 ? (
                                <p className="col-span-full text-center text-gray-500 py-8">No previous characters found.</p>
                            ) : (
                                existingCharacters.map((char, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => selectFromGallery(char)}
                                        className="cursor-pointer bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-500 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all group overflow-hidden"
                                    >
                                        <div className="h-32 bg-gray-700 w-full relative">
                                            {char.image ? (
                                                <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">?</div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="font-bold text-gray-200 truncate group-hover:text-purple-300">{char.name}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2">{char.description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Character Review Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-100">1. Review Characters</h2>
                        <p className="text-gray-400 mt-1 text-sm">Upload reference images or select from gallery for consistent looks.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {characters.map((char, index) => (
                        <div key={index} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50 flex flex-col sm:flex-row gap-4">
                            {/* Image Area */}
                            <div className="sm:w-32 flex-shrink-0 flex flex-col gap-2">
                                <div className="w-32 h-32 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center relative overflow-hidden group">
                                    {char.image ? (
                                        <>
                                            <img src={char.image} alt="Reference" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                title="Remove Image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-gray-600 text-xs text-center px-2">No Ref Image</span>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={el => fileInputRefs.current[index] = el} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUpload(index, e)} 
                                />
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => triggerFileUpload(index)}
                                        className="flex-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600 transition-colors"
                                    >
                                        Upload
                                    </button>
                                    <button 
                                        onClick={() => openGallery(index)}
                                        className="flex-1 py-1 text-xs bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 rounded border border-indigo-700/50 transition-colors"
                                    >
                                        Gallery
                                    </button>
                                </div>
                            </div>

                            {/* Details Area */}
                            <div className="flex-1 space-y-3">
                                <input 
                                    type="text" 
                                    value={char.name}
                                    onChange={(e) => onCharacterUpdate(index, { ...char, name: e.target.value })}
                                    className="w-full bg-transparent border-b border-gray-600 text-purple-300 font-bold text-lg focus:outline-none focus:border-purple-500 pb-1"
                                    placeholder="Character Name"
                                />
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Visual Description</label>
                                    <textarea
                                        value={char.description}
                                        onChange={(e) => onCharacterUpdate(index, { ...char, description: e.target.value })}
                                        className="w-full h-24 p-2 bg-gray-900/50 border border-gray-600 rounded text-sm text-gray-300 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none"
                                        placeholder="Detailed visual description..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {characters.length === 0 && (
                        <p className="text-gray-500 italic">No specific characters detected. The AI will interpret visuals per panel.</p>
                    )}
                </div>
            </div>

            {/* Storyline Review Section */}
            <div className="space-y-4 border-t border-gray-700 pt-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">2. Review Storyline</h2>
                    <p className="text-gray-400 mt-1 text-sm">These prompts will generate the vertical webtoon panels.</p>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
                    {storyline.map((prompt, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center font-bold text-sm text-purple-300 border border-purple-500/50 mt-1">
                                {index + 1}
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => onStorylineUpdate(index, e.target.value)}
                                className="w-full h-24 p-3 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 resize-y text-sm leading-relaxed"
                                aria-label={`Panel ${index + 1} prompt`}
                            />
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t border-gray-700/50">
                <button 
                    onClick={onBack}
                    className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                    &larr; Start Over
                </button>
                <button
                    onClick={handleGenerateClick}
                    className="flex items-center justify-center gap-2 px-8 py-3 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                >
                    <MagicIcon />
                    Generate Webtoon
                </button>
            </div>
        </div>
    );
};

export default StorylineReview;