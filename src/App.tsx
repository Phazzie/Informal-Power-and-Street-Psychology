/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Chat } from './components/Chat';
import { FileImport } from './components/FileImport';
import { Auth } from './components/Auth';
import { VoiceSession } from './components/VoiceSession';
import { Project } from './types';
import { BrainCircuit, LayoutGrid, Mic } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { useAnalysis } from './hooks/useAnalysis';
import { useDependencies } from './core/di/DIContext';
import { useAppState } from './core/state/AppContext';
import { toast } from 'react-toastify';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { storage } = useDependencies();
  const { state, dispatch } = useAppState();

  const { selectedProjectId, isImporting, isVoiceOpen } = state;

  const { projects } = useProjects(user?.uid);
  const { analyses, loadingProject, triggerAnalysis, clearAnalyses } = useAnalysis(user?.uid, selectedProjectId);

  // Auth Listener to clear state
  useEffect(() => {
    if (!authLoading && !user) {
      dispatch({ type: 'SET_PROJECT', payload: null });
      clearAnalyses();
    }
  }, [user, authLoading, clearAnalyses, dispatch]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const selectedAnalysis = selectedProjectId ? analyses[selectedProjectId] : null;

  const handleImport = useCallback(async (newProjects: Project[]) => {
    if (!user) {
      toast.error("Please sign in to save your material.");
      return;
    }

    try {
      toast.success("Importing material in the background...");
      
      // Close modal and set selected project immediately (Optimistic UI)
      dispatch({ type: 'CLOSE_IMPORT' });
      if (newProjects.length > 0) {
        dispatch({ type: 'SET_PROJECT', payload: newProjects[0].id });
      }

      // Offline queues / background upload
      for (const p of newProjects) {
        // Fire-and-forget background upload using offline-capable Firestore Adapter
        storage.saveProject(user.uid, p).catch(e => {
          toast.error(`Background upload failed for ${p.name}: ${e.message}`);
        });
      }
    } catch (e: any) {
      toast.error(`Failed to dispatch import: ${e.message}`);
    }
  }, [user, storage, dispatch]);

  const projectsInHeader = user ? (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => dispatch({ type: 'OPEN_IMPORT' })}
        className="bg-accent-orange text-white px-4 py-1.5 rounded font-bold text-[0.7rem] uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
      >
        Import Material
      </button>
      {selectedProject && (
        <button 
          onClick={() => triggerAnalysis(selectedProject)}
          disabled={loadingProject === selectedProjectId}
          className="bg-bg-card border border-border-main text-text-main px-4 py-1.5 rounded font-bold text-[0.7rem] uppercase tracking-widest hover:bg-bg-card/80 transition-all disabled:opacity-50"
        >
          {loadingProject === selectedProjectId ? 'Analyzing...' : 'Refresh Lens'}
        </button>
      )}
      {selectedProject && (
        <button 
          onClick={() => dispatch({ type: 'OPEN_VOICE' })}
          className="flex items-center gap-2 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange px-4 py-1.5 rounded font-bold text-[0.7rem] uppercase tracking-widest hover:bg-accent-orange/20 transition-all"
        >
          <Mic className="w-3.5 h-3.5" />
          Live Session
        </button>
      )}
    </div>
  ) : null;

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-deep">
        <div className="flex flex-col items-center gap-4">
          <BrainCircuit className="w-10 h-10 text-accent-orange animate-pulse" />
          <div className="text-accent-orange text-[0.65rem] tracking-[0.2em] uppercase font-bold animate-pulse">
            Initializing Core...
          </div>
        </div>
      </div>
    );
  }

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
          onSelectProject={(id: string) => dispatch({ type: 'SET_PROJECT', payload: id })}
          onImport={() => dispatch({ type: 'OPEN_IMPORT' })}
        />
      </nav>

      <main className="flex flex-col relative h-full overflow-hidden bg-bg-deep p-6 gap-6">
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-20 h-20 rounded-full bg-bg-card border border-border-main flex items-center justify-center">
               <BrainCircuit className="w-10 h-10 text-accent-orange opacity-40" />
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
          onClose={() => dispatch({ type: 'CLOSE_IMPORT' })}
        />
      )}

      {isVoiceOpen && selectedProject && (
        <VoiceSession 
          project={selectedProject}
          onClose={() => dispatch({ type: 'CLOSE_VOICE' })}
        />
      )}
    </div>
  );
}
