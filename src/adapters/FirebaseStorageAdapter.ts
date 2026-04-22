import { collection, doc, query, orderBy, setDoc, getDoc, serverTimestamp, Timestamp, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, AnalysisResult } from '../types';
import { IStoragePort } from '../core/ports/IStoragePort';
import { ProjectEntity } from '../domain/ProjectEntity';

export class FirebaseStorageAdapter implements IStoragePort {
  generateId(): string {
    return doc(collection(db, 'users')).id;
  }

  subscribeToProjects(userId: string, onUpdate: (projects: Project[]) => void, onError: (error: any) => void): () => void {
    const path = `users/${userId}/projects`;
    const projectsRef = collection(db, 'users', userId, 'projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const projectsList: Project[] = [];
      snapshot.forEach(document => {
        // Uncle Bob Audit #6: Anemic Domain Hydration
        const raw = document.data() as Project;
        projectsList.push(ProjectEntity.fromDTO(raw));
      });
      onUpdate(projectsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onError(error);
    });
  }

  async getProjects(userId: string): Promise<Project[]> {
    const path = `users/${userId}/projects`;
    try {
      const projectsRef = collection(db, 'users', userId, 'projects');
      const q = query(projectsRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const projectsList: Project[] = [];
      snap.forEach(document => {
        const raw = document.data() as Project;
        projectsList.push(ProjectEntity.fromDTO(raw));
      });
      return projectsList;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }

  async saveProject(userId: string, project: Project): Promise<void> {
    const path = `users/${userId}/projects/${project.id}`;
    
    // Protect encapsulation if it is an instance
    const cleanDto = project instanceof ProjectEntity ? (project as ProjectEntity).toDTO() : project;

    const projectWithMeta = {
      ...cleanDto,
      ownerId: userId,
      createdAt: Timestamp.now().toDate().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', userId, 'projects', project.id), projectWithMeta);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const path = `users/${userId}/projects/${projectId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  async getAnalysis(userId: string, projectId: string): Promise<AnalysisResult | null> {
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
      return null;
    }
  }

  async saveAnalysis(userId: string, projectId: string, analysis: AnalysisResult): Promise<void> {
    const path = `users/${userId}/projects/${projectId}/analysis/latest`;
    try {
      const analysisRef = doc(db, 'users', userId, 'projects', projectId, 'analysis', 'latest');
      await setDoc(analysisRef, analysis);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

