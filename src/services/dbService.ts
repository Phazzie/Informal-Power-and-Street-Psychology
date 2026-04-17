import { collection, doc, query, orderBy, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, AnalysisResult } from '../types';

export const getProjectsQuery = (userId: string) => {
  const projectsRef = collection(db, 'users', userId, 'projects');
  return query(projectsRef, orderBy('createdAt', 'desc'));
};

export const saveProject = async (userId: string, project: Project) => {
  const path = `users/${userId}/projects/${project.id}`;
  const projectWithMeta = {
    ...project,
    ownerId: userId,
    createdAt: Timestamp.now().toDate().toISOString()
  };
  try {
    await setDoc(doc(db, 'users', userId, 'projects', project.id), projectWithMeta);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const getProjectAnalysis = async (userId: string, projectId: string): Promise<AnalysisResult | null> => {
  const path = `users/${userId}/projects/${projectId}/analysis/latest`;
  try {
    const analysisRef = doc(db, 'users', userId, 'projects', projectId, 'analysis', 'latest');
    const snap = await getDoc(analysisRef);
    if (snap.exists()) {
      return snap.data() as AnalysisResult;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null; // unreachable due to throw in handleFirestoreError
  }
};

export const saveProjectAnalysis = async (userId: string, projectId: string, result: AnalysisResult) => {
  const path = `users/${userId}/projects/${projectId}/analysis/latest`;
  try {
    const analysisRef = doc(db, 'users', userId, 'projects', projectId, 'analysis', 'latest');
    await setDoc(analysisRef, result);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};
