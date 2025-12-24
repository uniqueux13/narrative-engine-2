import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";

// Initialize Gemini
// Note: In a real environment, never expose API keys on the client.
// This should be proxied through a backend. 
// For this demo, we assume process.env.API_KEY is available.

export const generateScriptForSlot = async (
  slotName: string,
  slotDescription: string,
  projectContext: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Gemini API Key is missing. Please check your configuration.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview"; 
    
    const prompt = `
      You are a specialized scriptwriter for short-form viral videos.
      
      Project Context: ${projectContext}
      Current Slot Name: ${slotName}
      Current Slot Goal: ${slotDescription}
      
      Task: Write a concise, engaging script (max 2 sentences) or a specific direction for action for this specific slot.
      Keep it punchy. Do not include scene headers. Just the spoken line or action.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Could not generate script.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to the Narrative Engine's AI core.";
  }
};

// --- Live API Transcription Service ---

export class LiveTranscriber {
  private sessionPromise: Promise<any> | null = null;

  async connect(onTranscript: (text: string) => void) {
    if (!process.env.API_KEY) {
      console.error("API Key missing for LiveTranscriber");
      throw new Error("API Key missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live session connected');
          },
          onmessage: (msg: LiveServerMessage) => {
            // We are only interested in inputTranscription (user speech) for this feature
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              if (text) {
                onTranscript(text);
              }
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
          },
          onerror: (err) => {
            console.error('Gemini Live session error:', err);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, // Enable transcription for user input
          speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
        }
      });
      
      return this.sessionPromise;
    } catch (e) {
      console.error("Failed to initiate Live session", e);
      throw e;
    }
  }

  sendAudio(data: Float32Array) {
    if (!this.sessionPromise) return;

    const pcmBlob = this.createBlob(data);
    this.sessionPromise.then((session) => {
      try {
        session.sendRealtimeInput({ media: pcmBlob });
      } catch (e) {
        console.error("Error sending audio chunk", e);
      }
    }).catch(e => {
        // Session might have failed to connect
        console.warn("Skipping audio send, session not ready", e);
    });
  }

  close() {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close()).catch(() => {});
      this.sessionPromise = null;
    }
  }

  // Helper to convert Float32Array to the blob format expected by Gemini Live
  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}