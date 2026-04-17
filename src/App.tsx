/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Chat } from './components/Chat';
import { FileImport } from './components/FileImport';
import { Auth } from './components/Auth';
import { VoiceSession } from './components/VoiceSession';
import { Project, AnalysisResult } from './types';
import { analyzeProject } from './services/geminiService';
import { MessageSquare, LayoutGrid, BrainCircuit, Mic } from 'lucide-react';
import { cn } from './lib/utils';
import { auth, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { getProjectsQuery, saveProject, getProjectAnalysis, saveProjectAnalysis } from './services/dbService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('subsurface_selected_project');
  });

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('subsurface_selected_project', selectedProjectId);
    }
  }, [selectedProjectId]);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [loadingProject, setLoadingProject] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProjects([]);
        setSelectedProjectId(null);
        setAnalyses({});
      }
    });
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/projects`;
    return onSnapshot(getProjectsQuery(user.uid), (snapshot) => {
      const projectsList: Project[] = [];
      snapshot.forEach(doc => {
        projectsList.push(doc.data() as Project);
      });
      setProjects(projectsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, [user]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const selectedAnalysis = selectedProjectId ? analyses[selectedProjectId] : null;

  // Analysis Fetching
  useEffect(() => {
    if (!user || !selectedProjectId || analyses[selectedProjectId]) return;

    getProjectAnalysis(user.uid, selectedProjectId).then(analysis => {
      if (analysis) {
        setAnalyses(prev => ({ ...prev, [selectedProjectId]: analysis }));
      }
    });
  }, [user, selectedProjectId, analyses]);

  const handleImport = async (newProjects: Project[]) => {
    if (!user) {
      alert("Please sign in to save your material.");
      return;
    }

    for (const p of newProjects) {
      await saveProject(user.uid, p);
    }
    
    setIsImporting(false);
    if (newProjects.length > 0) {
      handleSelectProject(newProjects[0].id);
    }
  };

  const handleSelectProject = async (id: string) => {
    setSelectedProjectId(id);
  };

  const triggerAnalysis = async () => {
    if (!user || !selectedProject || loadingProject) return;

    setLoadingProject(selectedProjectId);
    try {
      const result = await analyzeProject(selectedProject);
      await saveProjectAnalysis(user.uid, selectedProject.id, result);
      setAnalyses(prev => ({ ...prev, [selectedProject.id]: result }));
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoadingProject(null);
    }
  };

  const projectsInHeader = user ? (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setIsImporting(true)}
        className="bg-accent-orange text-white px-4 py-1.5 rounded font-bold text-[0.7rem] uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
      >
        Import Material
      </button>
      {selectedProject && (
        <button 
          onClick={triggerAnalysis}
          disabled={loadingProject === selectedProjectId}
          className="bg-bg-card border border-border-main text-text-main px-4 py-1.5 rounded font-bold text-[0.7rem] uppercase tracking-widest hover:bg-bg-card/80 transition-all disabled:opacity-50"
        >
          {loadingProject === selectedProjectId ? 'Analyzing...' : 'Refresh Lens'}
        </button>
      )}
      {selectedProject && (
        <button 
          onClick={() => setIsVoiceOpen(true)}
          className="flex items-center gap-2 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange px-4 py-1.5 rounded font-bold text-[0.7rem] uppercase tracking-widest hover:bg-accent-orange/20 transition-all"
        >
          <Mic className="w-3.5 h-3.5" />
          Live Session
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="grid grid-cols-[240px_1fr_300px] grid-rows-[60px_1fr] h-screen w-full bg-bg-deep font-sans overflow-hidden">
      <header className="col-span-full border-b section-border px-6 flex items-center justify-between bg-bg-surface z-10 shrink-0">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-accent-orange" />
          <div className="logo text-lg font-bold tracking-tight text-text-main">
            SUBSURFACE <span className="text-accent-orange">// PATTERN ANALYST</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {projectsInHeader}
          <Auth user={user} />
        </div>
      </header>

      <nav className="bg-bg-surface border-r section-border flex flex-col min-h-0">
        <Sidebar 
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onImport={() => setIsImporting(true)}
        />
      </nav>

      <main className="flex flex-col relative h-full overflow-hidden bg-bg-deep p-6 gap-6">
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-20 h-20 rounded-full bg-bg-card border border-border-main flex items-center justify-center">
               < BrainCircuit className="w-10 h-10 text-accent-orange opacity-40" />
             </div>
             <div className="space-y-2">
               <h1 className="text-2xl font-bold text-text-main">Welcome to Subsurface</h1>
               <p className="text-sm text-text-dim/60 max-w-sm">
                 Please sign in to begin analyzing your creative material and find the patterns that hide who you are.
               </p>
             </div>
             <Auth user={null} />
          </div>
        ) : selectedProject ? (
          <>
            <div className="flex items-end justify-between shrink-0">
              <h1 className="text-2xl font-normal text-text-main">
                {selectedProject.name}{' '}
                <span className="opacity-50 text-[0.9rem]">
                  — {selectedProject.conversations.length} Sessions Parsed
                </span>
              </h1>
            </div>
            
            <div className="flex-1 min-h-0">
              <AnalysisDashboard 
                project={selectedProject}
                analysis={selectedAnalysis || null}
                loading={loadingProject === selectedProjectId}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="space-y-6 max-w-lg">
              <div className="relative inline-block">
                <LayoutGrid className="w-16 h-16 text-white/5 mx-auto" />
                <div className="absolute inset-0 bg-accent-orange/10 blur-2xl rounded-full" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Select Project</h1>
                <p className="text-text-dim leading-relaxed text-sm">
                  Import or select a research project to begin subsurface pattern parsing.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <aside className="bg-bg-surface border-l section-border flex flex-col min-h-0 relative">
        <Chat 
          project={selectedProject}
          isOpen={true} 
          onClose={() => {}} 
        />
      </aside>

      {isImporting && (
        <FileImport 
          onImport={handleImport}
          onClose={() => setIsImporting(false)}
        />
      )}

      {isVoiceOpen && selectedProject && (
        <VoiceSession 
          project={selectedProject}
          onClose={() => setIsVoiceOpen(false)}
        />
      )}
    </div>
  );
}
