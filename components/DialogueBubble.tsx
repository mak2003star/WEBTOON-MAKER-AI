import React, { useState, useEffect, useRef, MouseEvent, TouchEvent } from 'react';
import type { DialogueLine, DialogueType } from '../types';
import type { BubbleSize } from '../App';

interface DialogueBubbleProps {
  dialogueLine: DialogueLine;
  bubbleSize: BubbleSize;
  onDelete: () => void;
  onUpdate: (updates: Partial<DialogueLine>) => void;
}

const colorPalette = ['#EC4899', '#A855F7', '#D946EF', '#8B5CF6', '#F472B6'];

const getCharacterColor = (characterName: string): string => {
  if (!characterName) return colorPalette[0];
  let hash = 0;
  for (let i = 0; i < characterName.length; i++) {
    const char = characterName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const index = Math.abs(hash % colorPalette.length);
  return colorPalette[index];
};

const DialogueBubble: React.FC<DialogueBubbleProps> = ({ dialogueLine, bubbleSize, onDelete, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({ character: dialogueLine.character, line: dialogueLine.line });
  const [currentPosition, setCurrentPosition] = useState(dialogueLine.position);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPosition(dialogueLine.position);
  }, [dialogueLine.position]);

  useEffect(() => {
    setEditState({ character: dialogueLine.character, line: dialogueLine.line });
  }, [dialogueLine.character, dialogueLine.line]);

  const getClientCoords = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if ('touches' in e) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const getMoveClientCoords = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
    if ('touches' in e) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handleDragStart = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (isEditing || !bubbleRef.current) return;
    e.stopPropagation();
    setIsDragging(true);
    
    const { clientX, clientY } = getClientCoords(e);
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    dragOffset.current = { x: clientX - bubbleRect.left, y: clientY - bubbleRect.top };
    
    if (e.type === 'touchstart') e.preventDefault();
  };

  const handleDragMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
    if (!isDragging || !bubbleRef.current?.parentElement) return;

    const { clientX, clientY } = getMoveClientCoords(e);
    const parentRect = bubbleRef.current.parentElement.getBoundingClientRect();

    const newXpx = clientX - parentRect.left - dragOffset.current.x;
    const newYpx = clientY - parentRect.top - dragOffset.current.y;

    const newCenterXpx = newXpx + bubbleRef.current.offsetWidth / 2;
    const newCenterYpx = newYpx + bubbleRef.current.offsetHeight / 2;
    
    const xPercent = Math.max(0, Math.min(100, (newCenterXpx / parentRect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (newCenterYpx / parentRect.height) * 100));
    
    setCurrentPosition({ x: xPercent, y: yPercent });
  };
  
  const handleDragEnd = () => {
    if (isDragging) {
        onUpdate({ position: currentPosition });
        setIsDragging(false);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, currentPosition]);

  const handleDoubleClick = () => {
    if (!isEditing) setIsEditing(true);
  };

  const handleEditSave = () => {
    onUpdate({ character: editState.character, line: editState.line });
    setIsEditing(false);
  };
  
  const handleEditCancel = () => {
    setEditState({ character: dialogueLine.character, line: dialogueLine.line });
    setIsEditing(false);
  };
  
  const characterColor = getCharacterColor(dialogueLine.character);
  const sizeStyles = { sm: 'p-2 text-xs', md: 'p-3 text-sm', lg: 'p-4 text-base' };
  const currentSizeClass = sizeStyles[bubbleSize] || sizeStyles.md;

  const typeStyles = {
    speech: 'rounded-lg',
    sfx: 'rounded-[1.5em] border-2 border-dashed'
  };
  const currentTypeClass = typeStyles[dialogueLine.type] || typeStyles.speech;

  return (
    <div
      ref={bubbleRef}
      className={`absolute group bg-gray-900/80 backdrop-blur-sm border border-white/10 text-white shadow-xl select-none transform -translate-x-1/2 -translate-y-1/2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${currentSizeClass} ${currentTypeClass}`}
      style={{ left: `${currentPosition.x}%`, top: `${currentPosition.y}%`, minWidth: '80px', maxWidth: '40%', zIndex: isDragging || isEditing ? 20 : 10, touchAction: 'none' }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onDoubleClick={handleDoubleClick}
    >
        {isEditing ? (
            <div className="flex flex-col gap-2 w-48">
                {dialogueLine.type === 'speech' && (
                  <input type="text" value={editState.character} onChange={e => setEditState({...editState, character: e.target.value})} className="bg-gray-700 p-1 rounded text-xs" placeholder="Character"/>
                )}
                <textarea value={editState.line} onChange={e => setEditState({...editState, line: e.target.value})} className="bg-gray-700 p-1 rounded text-xs h-16 resize-none" placeholder="Dialogue..."/>
                <div className="flex gap-1 justify-end">
                    <button onClick={handleEditCancel} className="px-2 py-0.5 text-xs bg-gray-600 rounded">Cancel</button>
                    <button onClick={handleEditSave} className="px-2 py-0.5 text-xs bg-purple-600 rounded">Save</button>
                </div>
            </div>
        ) : (
            <>
                {dialogueLine.type === 'speech' ? (
                    <p style={{ color: characterColor }}>
                        <span className="font-bold">{dialogueLine.character}:</span> "{dialogueLine.line}"
                    </p>
                ) : (
                    <p className="font-bold text-center text-pink-400 italic text-lg">{dialogueLine.line}</p>
                )}
                <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onDelete} className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold" aria-label="Delete bubble">&times;</button>
                </div>
            </>
        )}

      {dialogueLine.type === 'speech' && !isEditing && (
        <div className="absolute left-1/2 bottom-[-8px] transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent" style={{ borderTop: '10px solid rgba(17, 24, 39, 0.80)' }}></div>
      )}
    </div>
  );
};

export default DialogueBubble;
