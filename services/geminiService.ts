
import { GoogleGenAI, Type, GenerateContentResponse, Modality, Part, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { DialogueLine, Character, ArtStyle } from '../types';

// --- API Key Management ---
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Service Functions ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A wrapper function to add retry logic with exponential backoff to API calls.
 * This helps handle rate limiting errors (429) gracefully.
 */
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (err) {
            const error = err as any;
            const message = error.message || error.toString();

            if (message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded") || message.includes("429") || message.includes("503")) {
                if (attempt === maxRetries) {
                    console.error("Max retries reached. Failing operation.", error);
                    throw new Error("API busy or quota exceeded. Please try again later.");
                }
                const delay = initialDelay * Math.pow(2, attempt - 1); 
                console.warn(`API Error. Retrying in ${delay / 1000}s... (Attempt ${attempt})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Exceeded max retries for API call.");
};

const STYLE_PROMPTS: Record<ArtStyle, string> = {
    modern_action: "Style: Modern Action Manhwa (Solo Leveling style). Details: High contrast, sharp digital linework, dynamic cinematic lighting, glowing magical effects, vibrant colors, 8k resolution, masterpiece.",
    romance: "Style: Modern Romance Webtoon (True Beauty style). Details: Soft and dreamy lighting, pastel color palette, delicate linework, highly detailed eyes and hair, fashion-focused, emotional atmosphere, sparkling effects.",
    fantasy: "Style: High Fantasy Manhwa. Details: Epic scale, intricate armor and costume designs, painting-like backgrounds, atmospheric lighting, magical aura, detailed textures, cinematic composition.",
    horror: "Style: Horror/Thriller Webtoon. Details: Gritty texture, deep shadows, muted and desaturated colors, high contrast, psychological horror atmosphere, intense and unsettling expressions.",
    slice_of_life: "Style: Slice of Life Webtoon. Details: Clean and simple lines, bright and cheerful flat colors, relatable character designs, cozy atmosphere, clear visual storytelling.",
    mature: "Style: Adult Manhwa (Seinen/Josei). Details: Mature themes, gritty realism, expressive anatomy, dramatic and moody lighting, intense emotional atmosphere, high detail, cinematic framing, racy but tasteful."
};

// Relaxed safety settings for "Mature" content to avoid over-blocking valid storytelling
const RELAXED_SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
];

export const generateChapterStoryline = async (prompt: string, dialogueFocus: string = ''): Promise<{ storyline: string[]; characters: Character[] }> => {
    const storylineSystemInstruction = `You are a master webtoon writer and director.
    1. **Characters**: Create 1-3 main characters with DISTINCT visual features (Hair color, eye color, clothing style).
    2. **Story**: Create a 6-8 panel vertical storyline description based on the user's idea.
    3. **Cinematography**: For EACH panel, explicitly specify a dynamic camera angle or composition to enhance the storytelling. 
       - MANDATORY: Use variety such as "Extreme Close-up", "Low Angle looking up", "High Angle", "Dutch Angle", "Over-the-shoulder", "Wide Shot".
       - Focus on visual impact and emotional framing (e.g., close-up on eyes for shock, low angle for power).
    4. **Format**: Return JSON.`;

    let fullPrompt = `Create a Webtoon storyline and character profiles from this idea: "${prompt}"`;
    if (dialogueFocus) {
        fullPrompt += `\n\nCritical Instruction: Ensure the scene descriptions heavily prioritize the following character interactions and dialogue themes: "${dialogueFocus}"`;
    }

    // Switched to gemini-2.0-flash for better free-tier availability/stability
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
        config: {
            systemInstruction: storylineSystemInstruction,
            safetySettings: RELAXED_SAFETY_SETTINGS,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    characters: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING, description: "Detailed visual description (Hair, Eyes, Clothes, Accessories)" }
                            },
                            required: ["name", "description"]
                        }
                    },
                    storyline: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                        }
                    }
                },
                required: ["storyline", "characters"]
            }
        }
    }));

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error", text);
        throw new Error("Failed to parse storyline data.");
    }

    return { 
        storyline: parsed.storyline || [], 
        characters: parsed.characters || [] 
    };
};

const parseDataUrl = (dataUrl: string) => {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid data URL");
    return { mimeType: matches[1], data: matches[2] };
};

const generateImage = async (prompt: string, style: ArtStyle, referenceImages: { name: string; dataUrl: string }[]): Promise<string> => {
    // Construct a prompt that strictly enforces the style and content
    const styleInstruction = STYLE_PROMPTS[style];
    
    let fullPrompt = `${styleInstruction} \n\n${prompt} \n\n(Vertical panel, 9:16 aspect ratio, full color, cel-shaded, dynamic camera angle, cinematic composition)`;

    const parts: Part[] = [];

    // Add reference images to the prompt parts if available
    if (referenceImages.length > 0) {
        fullPrompt += "\n\nSTRICT VISUAL CONSISTENCY REQUIRED. Use the provided reference images for character designs:";
        
        referenceImages.forEach((ref, index) => {
            try {
                const { mimeType, data } = parseDataUrl(ref.dataUrl);
                // Images must come before or mixed with text. We'll append them first.
                // For gemini-2.5-flash-image, passing the image as inline data works for reference.
                parts.push({
                    inlineData: {
                        mimeType,
                        data
                    }
                });
                fullPrompt += `\n- Reference Image ${index + 1} represents the character "${ref.name}".`;
            } catch (e) {
                console.warn(`Failed to parse reference image for ${ref.name}`, e);
            }
        });
    }

    // Add the text prompt part
    parts.push({ text: fullPrompt });

    // Switched to gemini-2.5-flash-image (Free tier friendly, General Image Gen)
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: parts
        },
        config: {
          responseModalities: [Modality.IMAGE],
          safetySettings: RELAXED_SAFETY_SETTINGS,
        },
    }), 3, 8000);

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) {
        throw new Error("Image generation failed.");
    }

    const mimeType = part.inlineData.mimeType || 'image/png';
    return `data:${mimeType};base64,${part.inlineData.data}`;
};

export const generateDialogue = async (prompt: string): Promise<DialogueLine[]> => {
    const dialogueSystemInstruction = `Generate 1-3 speech bubbles for a webtoon panel. Return JSON.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Scene Description: ${prompt}`,
        config: {
            responseMimeType: "application/json",
            safetySettings: RELAXED_SAFETY_SETTINGS,
            systemInstruction: dialogueSystemInstruction,
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    dialogues: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                character: { type: Type.STRING },
                                line: { type: Type.STRING },
                                position: {
                                    type: Type.OBJECT,
                                    properties: {
                                        x: { type: Type.NUMBER },
                                        y: { type: Type.NUMBER }
                                    },
                                    required: ["x", "y"]
                                }
                            },
                            required: ["character", "line", "position"]
                        }
                    },
                },
                required: ["dialogues"]
            },
        }
    }));

    const text = response.text;
    if (!text) return [];
    
    try {
        const parsed = JSON.parse(text);
        return (parsed.dialogues || []).map((d: any, index: number) => ({
            ...d,
            id: `dialogue-${Date.now()}-${index}`,
            type: 'speech' as const,
        }));
    } catch (e) {
        return [];
    }
};

export const generatePanel = async (prompt: string, characters: Character[] = [], style: ArtStyle = 'modern_action'): Promise<{ imageUrl: string; dialogue: DialogueLine[] }> => {
    // Ensure consistent character appearance by prepending context
    const characterContext = characters.map(c => `[Character: ${c.name}, Visuals: ${c.description}]`).join(' ');
    
    // Extract reference images if they exist
    const referenceImages = characters
        .filter(c => c.image && c.image.startsWith('data:image'))
        .map(c => ({ name: c.name, dataUrl: c.image! }));

    // The full prompt for image generation needs to be very specific
    const fullPrompt = `CHARACTERS: ${characterContext} \n\nSCENE ACTION: ${prompt}`;

    // Generate simultaneously to speed up processing
    const [imageUrl, dialogue] = await Promise.all([
        generateImage(fullPrompt, style, referenceImages),
        generateDialogue(fullPrompt)
    ]);

    return { imageUrl, dialogue };
};
