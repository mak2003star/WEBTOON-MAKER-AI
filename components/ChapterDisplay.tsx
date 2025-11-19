import React, { useState } from 'react';
import type { Chapter, DialogueLine, DialogueType } from '../types';
import type { BubbleSize } from '../App';
import PanelDisplay from './PanelDisplay';
import LoaderIcon from './icons/LoaderIcon';

declare const jspdf: any;
declare const html2canvas: any;

interface ChapterDisplayProps {
  chapter: Chapter | null;
  isGenerating: boolean;
  isAutoLayouting: boolean;
  progress: number;
  total: number;
  bubbleSize: BubbleSize;
  lastDeleted: boolean;
  onSave: () => void;
  onAutoLayout: () => void;
  onAddElement: (panelId: string, type: DialogueType) => void;
  onDeleteDialogue: (panelId: string, dialogueId: string) => void;
  onUpdateDialogue: (panelId: string, dialogueId: string, updates: Partial<DialogueLine>) => void;
  onUndoDelete: () => void;
}

const WelcomeMessage: React.FC = () => (
  <div className="bg-gray-800/30 rounded-xl p-8 text-center border-2 border-dashed border-gray-700 h-[60vh] flex flex-col justify-center items-center backdrop-blur-sm">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <h3 className="text-2xl font-bold text-gray-300 mb-2">Your Canvas Awaits</h3>
    <p className="text-gray-500">Start your webtoon journey by entering a story idea.</p>
  </div>
);

const GenerationProgress: React.FC<{ progress: number; total: number }> = ({ progress, total }) => (
    <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700 h-[50vh] flex flex-col justify-center items-center animate-pulse">
        <LoaderIcon />
        <h3 className="text-xl font-semibold text-purple-300 mt-6">Painting Your Story...</h3>
        <p className="text-gray-400 mt-2">Creating seamless vertical panels.</p>
        {total > 0 && (
            <div className="w-64 bg-gray-700 rounded-full h-2 mt-6 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(progress / total) * 100}%` }}
                ></div>
            </div>
        )}
        <p className="text-xs text-gray-500 mt-3 font-mono">{progress} / {total} panels completed</p>
    </div>
);


const ChapterDisplay: React.FC<ChapterDisplayProps> = ({ chapter, isGenerating, isAutoLayouting, progress, total, bubbleSize, lastDeleted, onSave, onAutoLayout, onAddElement, onDeleteDialogue, onUpdateDialogue, onUndoDelete }) => {
  const [exportStatus, setExportStatus] = useState<'idle' | 'pdf' | 'png'>('idle');

  const handleExportPDF = async () => {
    if (!chapter) return;
    setExportStatus('pdf');

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF('p', 'px', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      for (let i = 0; i < chapter.panels.length; i++) {
          const panelElement = document.getElementById(`panel-${chapter.panels[i].id}`);
          if (panelElement) {
              const canvas = await html2canvas(panelElement, {
                  allowTaint: true,
                  useCORS: true,
                  scale: 2, 
              });

              const imgData = canvas.toDataURL('image/jpeg', 0.90);
              const imgProps = doc.getImageProperties(imgData);
              const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

              if (i > 0) {
                  doc.addPage();
              }
              doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
          }
      }

      doc.save(`${chapter.title.replace(/\s/g, '_')}_Webtoon.pdf`);
    } catch (error) {
      console.error("PDF Export failed", error);
    } finally {
      setExportStatus('idle');
    }
  };

  const handleExportPNG = async () => {
    if (!chapter) return;
    setExportStatus('png');

    try {
      const panels = chapter.panels;
      const canvases: HTMLCanvasElement[] = [];
      let totalHeight = 0;
      let maxWidth = 0;

      // 1. Capture all panels individually
      for (const panel of panels) {
        const element = document.getElementById(`panel-${panel.id}`);
        if (element) {
          const canvas = await html2canvas(element, {
            allowTaint: true,
            useCORS: true,
            scale: 2, // High quality
            logging: false,
          });
          canvases.push(canvas);
          totalHeight += canvas.height;
          maxWidth = Math.max(maxWidth, canvas.width);
        }
      }

      if (canvases.length === 0) return;

      // 2. Create stitched canvas
      const stitchedCanvas = document.createElement('canvas');
      stitchedCanvas.width = maxWidth;
      stitchedCanvas.height = totalHeight;
      const ctx = stitchedCanvas.getContext('2d');

      if (!ctx) {
        console.error("Could not get 2D context for stitching");
        return;
      }

      // 3. Draw panels
      let currentY = 0;
      for (const canvas of canvases) {
        ctx.drawImage(canvas, 0, currentY);
        currentY += canvas.height;
      }

      // 4. Download
      const dataUrl = stitchedCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${chapter.title.replace(/\s+/g, '_')}_Full.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("PNG Export failed", error);
    } finally {
      setExportStatus('idle');
    }
  };
  
  if (isGenerating && chapter?.panels.length === 0) {
    return <GenerationProgress progress={progress} total={total} />;
  }

  if (!chapter) {
    return <WelcomeMessage />;
  }
  
  const isActionInProgress = isGenerating || isAutoLayouting || exportStatus !== 'idle';

  return (
    <div className="space-y-4">
        <div className="bg-gray-800/50 rounded-xl p-4 shadow-lg border border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-20 z-40 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white truncate max-w-xs">{chapter.title}</h2>
            <div className="flex gap-2 flex-wrap justify-center">
                {lastDeleted && (
                  <button onClick={onUndoDelete} disabled={isActionInProgress} className="px-3 py-1.5 text-xs font-bold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors">
                      Undo
                  </button>
                )}
                <button onClick={onAutoLayout} disabled={isActionInProgress} className="px-3 py-1.5 text-xs font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {isAutoLayouting && <LoaderIcon />}
                    {isAutoLayouting ? 'Fixing...' : 'Auto-Layout'}
                </button>
                <button onClick={onSave} disabled={isActionInProgress} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    Save
                </button>
                <button onClick={handleExportPDF} disabled={isActionInProgress} className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {exportStatus === 'pdf' && <LoaderIcon />}
                    {exportStatus === 'pdf' ? 'PDF...' : 'PDF'}
                </button>
                <button onClick={handleExportPNG} disabled={isActionInProgress} className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {exportStatus === 'png' && <LoaderIcon />}
                    {exportStatus === 'png' ? 'PNG...' : 'PNG'}
                </button>
            </div>
        </div>

        {isGenerating && total > 0 && <GenerationProgress progress={progress} total={total} />}

        {/* Webtoon Container: Centered, constrained width, vertical layout with NO gap to simulate continuous scroll */}
        <div className="max-w-md mx-auto bg-gray-900 shadow-2xl min-h-screen border-x border-gray-800">
            {chapter.panels.map((panel) => (
                <PanelDisplay 
                  key={panel.id} 
                  panel={panel} 
                  bubbleSize={bubbleSize}
                  onAddElement={onAddElement}
                  onDeleteDialogue={onDeleteDialogue}
                  onUpdateDialogue={onUpdateDialogue}
                />
            ))}
            
            {/* End of Chapter Marker */}
            <div className="py-12 text-center bg-black">
                <p className="text-gray-600 text-xs uppercase tracking-widest">End of Chapter</p>
            </div>
        </div>
    </div>
  );
};

export default ChapterDisplay;