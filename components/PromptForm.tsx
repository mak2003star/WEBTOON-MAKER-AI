
import React, { useState } from 'react';
import LoaderIcon from './icons/LoaderIcon';
import MagicIcon from './icons/MagicIcon';

interface PromptFormProps {
  onSubmit: (title: string, prompt: string, dialogueFocus: string) => void;
  isLoading: boolean;
}

const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [dialogueFocus, setDialogueFocus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && prompt.trim() && !isLoading) {
      onSubmit(title.trim(), prompt.trim(), dialogueFocus.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="manhwa-title" className="block text-sm font-medium text-gray-400 mb-1">Title</label>
        <input
          id="manhwa-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., The Crimson Blade"
          className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200"
          disabled={isLoading}
          required
        />
      </div>
      <div>
        <label htmlFor="manhwa-prompt" className="block text-sm font-medium text-gray-400 mb-1">Story Prompt</label>
        <textarea
          id="manhwa-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A lone swordsman with a mysterious past seeks revenge against the empire..."
          className="w-full h-28 p-3 bg-gray-700/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 resize-none"
          disabled={isLoading}
          required
        />
      </div>
      <div>
        <label htmlFor="dialogue-focus" className="block text-sm font-medium text-gray-400 mb-1">Character Interactions & Dialogue Focus (Optional)</label>
        <textarea
          id="dialogue-focus"
          value={dialogueFocus}
          onChange={(e) => setDialogueFocus(e.target.value)}
          placeholder="e.g., Hero is cold but protecting a child. Villain speaks in riddles. Focus on the tension between them."
          className="w-full h-20 p-3 bg-gray-700/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 resize-none"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !prompt.trim() || !title.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
      >
        {isLoading ? (
          <>
            <LoaderIcon />
            Generating...
          </>
        ) : (
          <>
            <MagicIcon />
            Generate Storyline
          </>
        )}
      </button>
    </form>
  );
};

export default PromptForm;
