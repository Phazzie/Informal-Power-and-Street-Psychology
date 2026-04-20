import { useState, useEffect, useCallback } from 'react';
import { AnalysisResult, Project } from '../types';
import { getProjectAnalysis, saveProjectAnalysis } from '../services/dbService';
import { analyzeProject } from '../services/geminiService';

export function useAnalysis(userId: string | undefined, selectedProjectId: string | null) {
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [loadingProject, setLoadingProject] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !selectedProjectId || analyses[selectedProjectId]) return;

    getProjectAnalysis(userId, selectedProjectId).then(analysis => {
      if (analysis) {
        setAnalyses(prev => ({ ...prev, [selectedProjectId]: analysis }));
      }
    });
  }, [userId, selectedProjectId, analyses]);

  const triggerAnalysis = useCallback(async (project: Project) => {
    if (!userId || loadingProject) return;

    setLoadingProject(project.id);
    try {
      const result = await analyzeProject(project);
      await saveProjectAnalysis(userId, project.id, result);
      setAnalyses(prev => ({ ...prev, [project.id]: result }));
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoadingProject(null);
    }
  }, [userId, loadingProject]);

  const clearAnalyses = useCallback(() => setAnalyses({}), []);

  return { 
    analyses, 
    loadingProject, 
    triggerAnalysis,
    clearAnalyses
  };
}
