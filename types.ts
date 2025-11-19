
export type DialogueType = 'speech' | 'sfx';

export interface DialogueLine {
  id: string;
  character: string;
  line: string;
  position: {
    x: number;
    y: number;
  };
  type: DialogueType;
}

export interface Character {
  name: string;
  description: string;
  image?: string; // Base64 Data URL
}

export interface Panel {
  id: string;
  prompt: string;
  imageUrl: string;
  dialogue: DialogueLine[];
}

export type ArtStyle = 'modern_action' | 'romance' | 'fantasy' | 'horror' | 'slice_of_life' | 'mature';

export interface Chapter {
  id: string;
  title: string;
  panels: Panel[];
  characters?: Character[];
  style?: ArtStyle;
}
