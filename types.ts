export interface Slot {
  id: string;
  name: string;
  description: string;
  durationHint?: string;
  requiredAspectRatio?: '9:16' | '16:9';
  hasSubtitles?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  slots: Slot[];
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Clip {
  slotId: string;
  blobUrl: string;
  blob: Blob;
  timestamp: number;
  transcript?: string;
}

export interface Project {
  id: string;
  recipeId: string;
  title: string;
  status: ProjectStatus;
  createdAt: number;
  clips: Record<string, Clip>; // slotId -> Clip
  outputUrl?: string;
}