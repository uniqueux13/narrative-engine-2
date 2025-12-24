import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, ProjectStatus, Clip, Recipe } from '../types';
import { MASTER_RECIPES } from '../constants';

interface ProjectContextType {
  projects: Project[];
  createProject: (recipeId: string, title: string) => string;
  getProject: (id: string) => Project | undefined;
  getRecipe: (id: string) => Recipe | undefined;
  addClip: (projectId: string, clip: Clip) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus, outputUrl?: string) => void;
  deleteProject: (projectId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  // Load from local storage mock on mount
  useEffect(() => {
    const saved = localStorage.getItem('grimwire_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Note: Blob URLs won't persist across refreshes in a real app without IndexedDB or re-fetching.
        // For this demo, we accept that refresh clears media but keeps metadata.
        setProjects(parsed);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    // We strip out the large blobs for local storage text limit reasons in a real scenario,
    // but for this simplified demo we just try to save what we can or mock it.
    // Ideally we wouldn't store blobs in LS.
    const projectsToSave = projects.map(p => ({
      ...p,
      clips: {} // Don't persist blobs to LS to avoid quota errors in this demo
    }));
    localStorage.setItem('grimwire_projects', JSON.stringify(projectsToSave));
  }, [projects]);

  const createProject = (recipeId: string, title: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      recipeId,
      title,
      status: ProjectStatus.DRAFT,
      createdAt: Date.now(),
      clips: {}
    };
    setProjects(prev => [newProject, ...prev]);
    return newProject.id;
  };

  const getProject = (id: string) => projects.find(p => p.id === id);
  
  const getRecipe = (id: string) => MASTER_RECIPES.find(r => r.id === id);

  const addClip = (projectId: string, clip: Clip) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          clips: { ...p.clips, [clip.slotId]: clip }
        };
      }
      return p;
    }));
  };

  const updateProjectStatus = (projectId: string, status: ProjectStatus, outputUrl?: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, status, outputUrl };
      }
      return p;
    }));
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  return (
    <ProjectContext.Provider value={{ projects, createProject, getProject, getRecipe, addClip, updateProjectStatus, deleteProject }}>
      {children}
    </ProjectContext.Provider>
  );
};
