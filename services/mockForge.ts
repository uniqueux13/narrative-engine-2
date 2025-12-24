import { Clip, ProjectStatus } from "../types";

// Simulates the upload and render process described in Phase 3
export const manifestProject = async (
  projectId: string, 
  clips: Record<string, Clip>,
  onStatusChange: (status: ProjectStatus, url?: string) => void
) => {
  // 1. Uploading Assets
  onStatusChange(ProjectStatus.UPLOADING);
  console.log(`[Forge] Uploading assets for project ${projectId}...`);
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 2. Processing (The Python Assembler)
  onStatusChange(ProjectStatus.PROCESSING);
  console.log(`[Forge] Assembler.py started for ${projectId}...`);
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Completed
  // In a real backend, we would return the merged URL.
  // For this local prototype, we return the URL of the first clip to ensure 
  // the data flow uses user-generated content.
  // The frontend will handle sequential playback of all clips.
  const clipsArray = Object.values(clips);
  const resultUrl = clipsArray.length > 0 ? clipsArray[0].blobUrl : "";
  
  console.log(`[Forge] Render complete. Output ready.`);
  onStatusChange(ProjectStatus.COMPLETED, resultUrl);
};