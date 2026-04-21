import { useState, useEffect } from 'react';
import { Project } from '../types';
import { useDependencies } from '../core/di/DIContext';

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const { storage } = useDependencies();

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      return;
    }

    const unsubscribe = storage.subscribeToProjects(
      userId,
      (projectsList) => setProjects(projectsList),
      (error) => console.error("Error subscribing to projects:", error)
    );

    return () => {
      unsubscribe();
    };
  }, [userId, storage]);

  return { projects, setProjects };
}
