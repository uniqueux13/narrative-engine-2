import { Clip, ProjectStatus } from "../types";

// Simulates the upload and render process described in Phase 3
// Now actually stitches video blobs in the browser!
export const manifestProject = async (
  projectId: string, 
  clips: Clip[], // Receives ordered array of clips
  onStatusChange: (status: ProjectStatus, url?: string) => void
) => {
  // 1. Uploading Assets
  onStatusChange(ProjectStatus.UPLOADING);
  console.log(`[Forge] Uploading assets for project ${projectId}...`);
  
  // Artificial delay to simulate cloud handoff
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 2. Processing (Client-Side Assembly)
  onStatusChange(ProjectStatus.PROCESSING);
  console.log(`[Forge] Assembler started for ${projectId}...`);
  
  try {
    const resultUrl = await stitchClips(clips);
    console.log(`[Forge] Render complete. Output ready.`);
    onStatusChange(ProjectStatus.COMPLETED, resultUrl);
  } catch (err) {
    console.error("Stitching failed:", err);
    onStatusChange(ProjectStatus.FAILED);
  }
};

/**
 * Client-side video stitching using Canvas & MediaRecorder.
 * This effectively "renders" the video in the browser tab.
 */
async function stitchClips(clips: Clip[]): Promise<string> {
  if (clips.length === 0) return "";
  if (clips.length === 1) return clips[0].blobUrl;

  console.log("Stitching clips:", clips);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const video = document.createElement("video");
  
  // Resolution: Standard HD Vertical (9:16)
  // We use 720p to ensure better performance on client devices
  canvas.width = 720; 
  canvas.height = 1280;

  if (!ctx) throw new Error("Canvas context failed");

  // Setup Audio Context for mixing video audio
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const dest = audioCtx.createMediaStreamDestination();
  const sourceNode = audioCtx.createMediaElementSource(video);
  sourceNode.connect(dest);
  
  // Setup Stream and Recorder
  const stream = canvas.captureStream(30); // 30 FPS
  const audioTrack = dest.stream.getAudioTracks()[0];
  if (audioTrack) {
    stream.addTrack(audioTrack);
  }

  // Determine supported mime type
  const mimeType = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ].find(type => MediaRecorder.isTypeSupported(type)) || '';

  if (!mimeType) {
    throw new Error("No supported MediaRecorder mimeType found.");
  }

  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      // Cleanup
      audioCtx.close();
      video.remove();
      canvas.remove();
      resolve(url);
    };

    mediaRecorder.onerror = (e) => reject(e);

    // Start Recording
    mediaRecorder.start();

    // Playback Loop
    let clipIndex = 0;

    // Helper to scale video to cover canvas (Object-fit: cover)
    const drawVideo = () => {
      if (video.paused || video.ended) return;
      
      const vW = video.videoWidth;
      const vH = video.videoHeight;
      const cW = canvas.width;
      const cH = canvas.height;

      // Calculate 'cover' scaling
      const scale = Math.max(cW / vW, cH / vH);
      const x = (cW - vW * scale) / 2;
      const y = (cH - vH * scale) / 2;

      ctx.drawImage(video, x, y, vW * scale, vH * scale);
      
      requestAnimationFrame(drawVideo);
    };

    video.playsInline = true;
    video.muted = false; // Must be false for audio to reach AudioContext, but sourceNode hijacks it so it won't play to speakers
    video.crossOrigin = "anonymous";

    const playNext = async () => {
      if (clipIndex >= clips.length) {
        mediaRecorder.stop();
        return;
      }

      const clip = clips[clipIndex];
      video.src = clip.blobUrl;
      video.currentTime = 0;

      try {
        await video.play();
        drawVideo();
      } catch (e) {
        console.error("Playback failed for clip", clipIndex, e);
        mediaRecorder.stop();
        reject(e);
      }

      video.onended = () => {
        clipIndex++;
        playNext();
      };
    };

    playNext();
  });
}