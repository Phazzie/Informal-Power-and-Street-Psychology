import { useState, useEffect } from 'react';
import { Project } from '../types';
import { getProjectsQuery } from '../services/dbService';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { onSnapshot } from 'firebase/firestore';

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      return;
    }

    const path = `users/${userId}/projects`;
    return onSnapshot(getProjectsQuery(userId), (snapshot) => {
      const projectsList: Project[] = [];
      snapshot.forEach(doc => {
        projectsList.push(doc.data() as Project);
      });
      setProjects(projectsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, [userId]);

  return { projects, setProjects };
}
