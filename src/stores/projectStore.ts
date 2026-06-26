import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  type: 'single' | 'bulk' | 'merge';
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  pageCount?: number;
  fileSize?: number;
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProjectId: null,
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    })),
  setCurrentProject: (id) => set({ currentProjectId: id }),
}));
