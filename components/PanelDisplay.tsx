import React from 'react';
import type { Panel, DialogueLine, DialogueType } from '../types';
import DialogueBubble from './DialogueBubble';
import type { BubbleSize } from '../App';

interface PanelDisplayProps {
  panel: Panel;
  bubbleSize: BubbleSize;
  onAddElement: (panelId: string, type: DialogueType) => void;
  onDeleteDialogue: (panelId: string, dialogueId: string) => void;
  onUpdateDialogue: (panelId: string, dialogueId: string, updates: Partial<DialogueLine>) => void;
}

const PanelDisplay: React.FC<PanelDisplayProps> = ({ panel, bubbleSize, onAddElement, onDeleteDialogue, onUpdateDialogue }) => {
  return (
    <div id={`panel-${panel.id}`} className="relative group bg-gray-900 w-full shadow-2xl overflow-hidden">
        {/* Panel Image - 9:16 Aspect Ratio handled by natural image dimensions in stack */}
      <img 
        src={panel.imageUrl} 
        alt={panel.prompt} 
        className="w-full h-auto block" 
        crossOrigin="anonymous" 
        loading="lazy"
      />
      
      {panel.dialogue.map((line) => (
        <DialogueBubble 
            key={line.id} 
            dialogueLine={line} 
            bubbleSize={bubbleSize}
            onDelete={() => onDeleteDialogue(panel.id, line.id)}
            onUpdate={(updates) => onUpdateDialogue(panel.id, line.id, updates)}
        />
      ))}

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-30">
          <button 
            onClick={() => onAddElement(panel.id, 'speech')}
            className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600/90 backdrop-blur-sm rounded-md hover:bg-purple-500 transition-colors shadow-lg border border-white/10"
          >
            + Speech
          </button>
          <button 
            onClick={() => onAddElement(panel.id, 'sfx')}
            className="px-3 py-1.5 text-xs font-bold text-white bg-pink-600/90 backdrop-blur-sm rounded-md hover:bg-pink-500 transition-colors shadow-lg border border-white/10"
          >
            + SFX
          </button>
      </div>
    </div>
  );
};

export default PanelDisplay;