
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Panel, Chapter, DialogueLine, DialogueType, Character, ArtStyle } from './types';
import { generateChapterStoryline, generatePanel, generateDialogue } from './services/geminiService';
import PromptForm from './components/PromptForm';
import ChapterDisplay from './components/ChapterDisplay';
import ChapterHistory from './components/ChapterHistory';
import StyleControls from './components/StyleControls';
import StorylineReview from './components/StorylineReview';

export type BubbleSize = 'sm' | 'md' | 'lg';
export type GenerationStage = 'idle' | 'generatingStoryline' | 'storylineReview' | 'generatingPanels';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');
  const [storyline, setStoryline] = useState<string[] | null>(null);
  const [generatedCharacters, setGeneratedCharacters] = useState<Character[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [totalPanels, setTotalPanels] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [bubbleSize, setBubbleSize] = useState<BubbleSize>('md');
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>('modern_action');
  const [lastDeletedBubble, setLastDeletedBubble] = useState<{ panelId: string; bubble: DialogueLine; index: number } | null>(null);
  const [isAutoLayouting, setIsAutoLayouting] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedChapters = localStorage.getItem('manhwaChapters');
      if (savedChapters) {
        setChapters(JSON.parse(savedChapters));
      }
    } catch (err) {
      console.error("Failed to load chapters from localStorage", err);
    }
  }, []);

  // Compute unique characters from all chapters for the gallery
  const existingCharacters = useMemo(() => {
    const chars: Character[] = [];
    const seen = new Set<string>();
    
    // Process chapters in reverse order (newest first) usually, but chapters array depends on how it's saved.
    // Assuming index 0 is newest if prepended.
    chapters.forEach(chapter => {
        if (chapter.characters) {
            chapter.characters.forEach(char => {
                // Create a unique key to avoid exact duplicates. 
                // We include name and a snippet of description.
                const key = `${char.name.toLowerCase()}-${char.description.substring(0, 15)}`;
                if (!seen.has(key)) {
                    chars.push(char);
                    seen.add(key);
                }
            });
        }
    });
    return chars;
  }, [chapters]);

  const handleSaveChapter = useCallback(() => {
    if (!currentChapter) return;
    const newChapters = [currentChapter, ...chapters.filter(c => c.id !== currentChapter.id)];
    setChapters(newChapters);
    localStorage.setItem('manhwaChapters', JSON.stringify(newChapters));
  }, [currentChapter, chapters]);
  
  const handleSelectChapter = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
        setCurrentChapter(chapter);
        setLastDeletedBubble(null);
        setGenerationStage('idle');
        setStoryline(null);
        setGeneratedCharacters(chapter.characters || []);
        if (chapter.style) setSelectedStyle(chapter.style);
    }
  };

  const handleDeleteChapter = (chapterId: string) => {
    const newChapters = chapters.filter(c => c.id !== chapterId);
    setChapters(newChapters);
    localStorage.setItem('manhwaChapters', JSON.stringify(newChapters));
    if (currentChapter?.id === chapterId) {
        setCurrentChapter(null);
    }
  };

  const handleGenerateStoryline = useCallback(async (title: string, prompt: string, dialogueFocus: string) => {
    setGenerationStage('generatingStoryline');
    setError(null);
    setCurrentChapter(null);
    setStoryline(null);
    setGeneratedCharacters([]);
    setCurrentTitle(title);
    setLastDeletedBubble(null);
    
    try {
      const { storyline: newStoryline, characters } = await generateChapterStoryline(prompt, dialogueFocus);
      setStoryline(newStoryline);
      setGeneratedCharacters(characters);
      setGenerationStage('storylineReview');
    } catch (err) {
      const rawMessage = (err as any)?.message || 'An unknown error occurred.';
      setError(`Storyline generation failed: ${rawMessage}`);
      setGenerationStage('idle');
    }
  }, []);

  const handleGeneratePanels = useCallback(async (approvedStoryline: string[]) => {
    setGenerationStage('generatingPanels');
    setError(null);
    setGenerationProgress(0);
    setTotalPanels(approvedStoryline.length);

    const chapterId = Date.now().toString();
    const newChapter: Chapter = { 
      id: chapterId, 
      title: currentTitle, 
      panels: [],
      characters: generatedCharacters,
      style: selectedStyle
    };
    setCurrentChapter(newChapter);

    try {
      for (let i = 0; i < approvedStoryline.length; i++) {
        const panelPrompt = approvedStoryline[i];
        // Pass the character context AND the selected style to ensure consistency and look
        const { imageUrl, dialogue } = await generatePanel(panelPrompt, generatedCharacters, selectedStyle);
        const newPanel: Panel = {
          id: `${chapterId}-panel-${i}`,
          prompt: panelPrompt,
          imageUrl,
          dialogue,
        };
        
        setCurrentChapter(prev => prev ? { ...prev, panels: [...prev.panels, newPanel] } : null);
        setGenerationProgress(i + 1);

        if (i < approvedStoryline.length - 1) {
          await sleep(15000); 
        }
      }
    } catch (err) {
      const rawMessage = (err as any)?.message || 'An unknown error occurred.';
      setError(`Panel generation failed: ${rawMessage}`);
    } finally {
      setGenerationStage('idle');
    }
  }, [currentTitle, generatedCharacters, selectedStyle]);

  const handleUpdateStoryline = useCallback((index: number, newPrompt: string) => {
    setStoryline(prev => {
        if (!prev) return null;
        const newStoryline = [...prev];
        newStoryline[index] = newPrompt;
        return newStoryline;
    });
  }, []);

  const handleUpdateCharacter = useCallback((index: number, updatedChar: Character) => {
    setGeneratedCharacters(prev => {
      const newChars = [...prev];
      newChars[index] = updatedChar;
      return newChars;
    });
  }, []);

  const handleBackToPrompt = () => {
    setGenerationStage('idle');
    setStoryline(null);
    setCurrentChapter(null);
    setError(null);
  }
  
  const handleAutoLayout = useCallback(async () => {
    if (!currentChapter) return;
    setIsAutoLayouting(true);
    setError(null);
    setLastDeletedBubble(null);
    
    const chars = currentChapter.characters || [];
    const characterContext = chars.map(c => `[Character: ${c.name}, Visuals: ${c.description}]`).join(' ');

    try {
      for (const panel of currentChapter.panels) {
        const fullPrompt = `${characterContext} \n\nScene: ${panel.prompt}`;
        const newDialogue = await generateDialogue(fullPrompt);
        setCurrentChapter(prev => {
          if (!prev) return null;
          return {
            ...prev,
            panels: prev.panels.map(p => p.id === panel.id ? { ...p, dialogue: newDialogue } : p)
          };
        });
        await sleep(15000); 
      }
    } catch (err) {
       const rawMessage = (err as any)?.message || 'An unknown error occurred.';
       setError(`Auto-layout failed: ${rawMessage}`);
    } finally {
        setIsAutoLayouting(false);
    }
  }, [currentChapter]);

  const handleAddElement = useCallback((panelId: string, type: DialogueType) => {
    setCurrentChapter(prev => {
        if (!prev) return null;
        const newElement: DialogueLine = {
            id: `bubble-${Date.now()}`,
            character: type === 'speech' ? "Character" : "",
            line: type === 'sfx' ? "SFX!" : "New dialogue...",
            position: { x: 50, y: 50 },
            type: type
        };
        return {
            ...prev,
            panels: prev.panels.map(p => 
                p.id === panelId 
                ? { ...p, dialogue: [...p.dialogue, newElement] } 
                : p
            )
        };
    });
    setLastDeletedBubble(null);
  }, []);

  const handleDeleteDialogue = useCallback((panelId: string, dialogueId: string) => {
    setCurrentChapter(prev => {
        if (!prev) return null;
        let deletedBubble: DialogueLine | null = null;
        let originalIndex = -1;
        const panel = prev.panels.find(p => p.id === panelId);
        if (panel) {
            originalIndex = panel.dialogue.findIndex(d => d.id === dialogueId);
            if (originalIndex > -1) {
                deletedBubble = panel.dialogue[originalIndex];
            }
        }
        if (deletedBubble) {
            setLastDeletedBubble({ panelId, bubble: deletedBubble, index: originalIndex });
        }
        return {
            ...prev,
            panels: prev.panels.map(p => 
                p.id === panelId 
                ? { ...p, dialogue: p.dialogue.filter(d => d.id !== dialogueId) } 
                : p
            )
        };
    });
  }, []);

  const handleUpdateDialogue = useCallback((panelId: string, dialogueId: string, updates: Partial<DialogueLine>) => {
      setCurrentChapter(prev => {
          if (!prev) return null;
          return {
              ...prev,
              panels: prev.panels.map(p => 
                  p.id === panelId 
                  ? { ...p, dialogue: p.dialogue.map(d => 
                          d.id === dialogueId 
                          ? { ...d, ...updates } 
                          : d
                      ) }
                  : p
              )
          };
      });
  }, []);

  const handleUndoDelete = useCallback(() => {
      if (!lastDeletedBubble) return;
      const { panelId, bubble, index } = lastDeletedBubble;
      setCurrentChapter(prev => {
          if (!prev) return null;
          return {
              ...prev,
              panels: prev.panels.map(p => {
                  if (p.id === panelId) {
                      const newDialogue = [...p.dialogue];
                      newDialogue.splice(index, 0, bubble);
                      return { ...p, dialogue: newDialogue };
                  }
                  return p;
              })
          };
      });
      setLastDeletedBubble(null);
  }, [lastDeletedBubble]);


  const renderContent = () => {
    if (generationStage === 'storylineReview' && storyline) {
        return (
            <StorylineReview 
                storyline={storyline}
                characters={generatedCharacters}
                existingCharacters={existingCharacters}
                onStorylineUpdate={handleUpdateStoryline}
                onCharacterUpdate={handleUpdateCharacter}
                onGeneratePanels={handleGeneratePanels}
                onBack={handleBackToPrompt}
            />
        );
    }

    return (
        <ChapterDisplay 
          chapter={currentChapter} 
          isGenerating={generationStage === 'generatingPanels'} 
          isAutoLayouting={isAutoLayouting}
          progress={generationProgress}
          total={totalPanels}
          bubbleSize={bubbleSize} 
          lastDeleted={!!lastDeletedBubble}
          onSave={handleSaveChapter}
          onAutoLayout={handleAutoLayout}
          onAddElement={handleAddElement}
          onDeleteDialogue={handleDeleteDialogue}
          onUpdateDialogue={handleUpdateDialogue}
          onUndoDelete={handleUndoDelete}
        />
    );
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="py-6 text-center border-b border-gray-700/50 shadow-lg bg-gray-900/95 sticky top-0 z-50 backdrop-blur-md">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          Manhwa Maker AI
        </h1>
        <p className="text-gray-400 mt-2 text-sm tracking-wide">AI-Powered Webtoon Creation</p>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-xl border border-gray-700 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-4 text-gray-200">Create Series</h2>
              <PromptForm onSubmit={handleGenerateStoryline} isLoading={generationStage === 'generatingStoryline'} />
            </div>
            
            <StyleControls 
                selectedSize={bubbleSize} 
                onSizeChange={setBubbleSize} 
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
            />
            
            <ChapterHistory chapters={chapters} onSelect={handleSelectChapter} onDelete={handleDeleteChapter} />
          </div>

          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6 shadow-lg" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {renderContent()}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600 text-xs mt-8 border-t border-gray-800">
        <p>Powered by Gemini AI & Imagen. Created for illustrative purposes.</p>
      </footer>
    </div>
  );
};

export default App;
