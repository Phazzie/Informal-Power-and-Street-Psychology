import { Project, AnalysisResult } from '../../types';

export interface IStoragePort {
  /**
   * Generates a unique identifier for new records
   */
  generateId(): string;

  /**
   * Subscribe to real-time project updates for a user
   * Returns an unsubscribe function.
   */
  subscribeToProjects(userId: string, onUpdate: (projects: Project[]) => void, onError: (error: any) => void): () => void;

  /**
   * Fetch all projects for the current authenticated user (One shot)
   */
  getProjects(userId: string): Promise<Project[]>;

  /**
   * Save or overwrite a single project
   */
  saveProject(userId: string, project: Project): Promise<void>;

  /**
   * Remove a project by its identifier
   */
  deleteProject(userId: string, projectId: string): Promise<void>;

  /**
   * Retrieve an analysis by its parent project identifier
   */
  getAnalysis(userId: string, projectId: string): Promise<AnalysisResult | null>;

  /**
   * Save an analysis result
   */
  saveAnalysis(userId: string, projectId: string, analysis: AnalysisResult): Promise<void>;
}
