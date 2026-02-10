
import { ProjectAssumptions, MonthlyData } from '../types';

export interface SavedProject {
  id: string;
  timestamp: number;
  name: string;
  assumptions: ProjectAssumptions;
  technicalResults: {
    monthlyData: { month: string; energy: number }[] | null;
    totalAnnual: number;
  };
}

const STORAGE_KEY = 'nursun_project_db';

export const storageService = {
  /**
   * Get all projects from the database
   */
  getAllProjects: (): SavedProject[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading from database:', e);
      return [];
    }
  },

  /**
   * Save a project scenario
   */
  saveProject: (project: Omit<SavedProject, 'id' | 'timestamp'>): SavedProject => {
    const projects = storageService.getAllProjects();
    const newProject: SavedProject = {
      ...project,
      id: `NSE-DB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: Date.now()
    };
    
    projects.unshift(newProject);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return newProject;
  },

  /**
   * Delete a project from the database
   */
  deleteProject: (id: string): void => {
    const projects = storageService.getAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};
