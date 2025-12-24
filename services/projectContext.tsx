import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, ProjectStatus, Clip, Recipe } from '../types';
import { MASTER_RECIPES } from '../constants';

interface ProjectContextType {
  projects: Project[];
  customRecipes: Recipe[];
  createProject: (recipeId: string, title: string) => string;
  saveCustomRecipe: (recipe: Recipe) => void;
  getProject: (id: string) => Project | undefined;
  getRecipe: (id: string) => Recipe | undefined;
  addClip: (projectId: string, clip: Clip) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus, outputUrl?: string) => void;
  deleteProject: (projectId: string) => void;
  getAllRecipes: () => Recipe[];
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
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('grimwire_projects');
    const savedRecipes = localStorage.getItem('grimwire_custom_recipes');
    
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }

    if (savedRecipes) {
      try {
        setCustomRecipes(JSON.parse(savedRecipes));
      } catch (e) {
        console.error("Failed to load recipes", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    const projectsToSave = projects.map(p => ({
      ...p,
      clips: {} // Don't persist blobs to LS
    }));
    localStorage.setItem('grimwire_projects', JSON.stringify(projectsToSave));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('grimwire_custom_recipes', JSON.stringify(customRecipes));
  }, [customRecipes]);

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

  const saveCustomRecipe = (recipe: Recipe) => {
    setCustomRecipes(prev => [...prev, recipe]);
  };

  const getProject = (id: string) => projects.find(p => p.id === id);
  
  const getRecipe = (id: string) => {
    return MASTER_RECIPES.find(r => r.id === id) || customRecipes.find(r => r.id === id);
  };

  const getAllRecipes = () => [...customRecipes, ...MASTER_RECIPES];

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
    <ProjectContext.Provider value={{ 
      projects, 
      customRecipes, 
      createProject, 
      saveCustomRecipe, 
      getProject, 
      getRecipe, 
      addClip, 
      updateProjectStatus, 
      deleteProject,
      getAllRecipes
    }}>
      {children}
    </ProjectContext.Provider>
  );
};