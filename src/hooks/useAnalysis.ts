import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalysisResult, Project } from '../types';
import { useDependencies } from '../core/di/DIContext';
import { toast } from 'react-toastify';

export function useAnalysis(userId: string | undefined, selectedProjectId: string | null) {
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [loadingProject, setLoadingProject] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { storage, llm } = useDependencies();

  // Cancel immediately if the user switches out of the project component entirely
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!userId || !selectedProjectId || analyses[selectedProjectId]) return;

    storage.getAnalysis(userId, selectedProjectId).then(analysis => {
      if (analysis) {
        setAnalyses(prev => ({ ...prev, [selectedProjectId]: analysis }));
      }
    });
  }, [userId, selectedProjectId, analyses, storage]);

  const triggerAnalysis = useCallback(async (project: Project) => {
    if (!userId || loadingProject) return;

    // If an ongoing analysis was running, kill it before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoadingProject(project.id);
    const toastId = toast.loading(`Refreshing structural lens on ${project.name}...`);
    try {
      const authorVoice = project.conversations.map(c => c.messages.map(m => m.content).join('\n')).join('\n'); // extracted to avoid coupling to original parser right now, though LLM adapter handles it? No wait, llm adapter takes raw author voice. Let's make LLM adapter handle it or we do it here. 
      // Actually we have exportAuthorVoice exported from parser, let's use that to be strictly identical
      const { exportAuthorVoice } = await import('../utils/parser');
      const voice = exportAuthorVoice(project);
      
      const result = await llm.analyzeMaterial(voice, { signal: abortControllerRef.current.signal });
      await storage.saveAnalysis(userId, project.id, result);
      setAnalyses(prev => ({ ...prev, [project.id]: result }));
      toast.update(toastId, { render: "Lens parsed successfully.", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.update(toastId, { render: "Analysis Aborted.", type: "warning", isLoading: false, autoClose: 2000 });
      } else {
        console.error("Analysis failed:", error);
        toast.update(toastId, { render: `Analysis Failed: ${error.message || 'Unknown network threshold'}`, type: "error", isLoading: false, autoClose: 5000 });
      }
    } finally {
      if (loadingProject === project.id) {
        setLoadingProject(null);
      }
      abortControllerRef.current = null;
    }
  }, [userId, loadingProject, storage, llm]);

  const clearAnalyses = useCallback(() => setAnalyses({}), []);

  return { 
    analyses, 
    loadingProject, 
    triggerAnalysis,
    clearAnalyses
  };
}
