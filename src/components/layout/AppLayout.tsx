import React from 'react';
import { Sidebar } from '../Sidebar';
import { AnalysisDashboard } from '../AnalysisDashboard';
import { Chat } from '../Chat';
import { FileImport } from '../FileImport';
import { Auth } from '../Auth';
import { VoiceSession } from '../VoiceSession';
import { Project, AnalysisResult } from '../../types';
import { MessageSquare, LayoutGrid, BrainCircuit, Mic } from 'lucide-react';
import { cn } from '../../lib/utils';
import { User } from 'firebase/auth';

interface AppLayoutProps {
  user: User | null;
  projects: Project[];
  selectedProject: Project | null;
  selectedAnalysis: AnalysisResult | null;
  loadingProject: string | null;
  isImporting: boolean;
  isVoiceOpen: boolean;
  setIsImporting: (b: boolean) => void;
  setIsVoiceOpen: (b: boolean) => void;
  onSelectProject: (id: string) => void;
  onImport: (newProjects: Project[]) => void;
  onTriggerAnalysis: (p: Project) => void;
}

export function AppLayout({
  user,
  projects,
  selectedProject,
  selectedAnalysis,
  loadingProject,
  isImporting,
  isVoiceOpen,
  setIsImporting,
  setIsVoiceOpen,
  onSelectProject,
  onImport,
  onTriggerAnalysis
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-bg-deep text-text-main font-sans selection:bg-accent-orange/30 overflow-hidden">
      <Auth user={user} />
      
      {/* Sidebar - Navigation */}
      <Sidebar 
        projects={projects}
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={onSelectProject}
        onImport={() => setIsImporting(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-bg-surface relative border-l border-r border-border-main z-10 shadow-2xl">
        {selectedProject ? (
          <>
            <header className="h-16 border-b border-border-main flex items-center justify-between px-6 bg-bg-surface/80 backdrop-blur-md sticky top-0 shrink-0 z-20">
              <div className="flex items-center gap-3">
                <BrainCircuit className="w-5 h-5 text-accent-orange" />
                <h1 className="font-medium tracking-tight truncate max-w-[300px]">
                  {selectedProject.name}
                </h1>
              </div>
              <div className="flex items-center gap-2" role="group" aria-label="Project actions">
                <button
                  onClick={() => setIsVoiceOpen(true)}
                  aria-label="Start live voice sync session"
                  aria-expanded={isVoiceOpen}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-dim hover:text-accent-orange border border-transparent hover:border-border-main rounded transition-all bg-bg-deep/50 hover:bg-bg-deep"
                >
                  <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                  Live Sync
                </button>
                <button
                  onClick={() => onTriggerAnalysis(selectedProject)}
                  disabled={loadingProject === selectedProject.id}
                  aria-label={loadingProject === selectedProject.id ? "Analyzing project..." : "Run project analysis"}
                  aria-busy={loadingProject === selectedProject.id}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all",
                    loadingProject === selectedProject.id
                      ? "bg-bg-deep text-text-dim border border-border-main opacity-50 cursor-not-allowed"
                      : "bg-accent-orange text-bg-deep hover:bg-[#ff8c3a] shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)] hover:shadow-[0_0_20px_-3px_rgba(249,115,22,0.6)]"
                  )}
                >
                  {loadingProject === selectedProject.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-text-dim border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      Parsing...
                    </div>
                  ) : (
                    <>
                      <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
              <AnalysisDashboard 
                project={selectedProject}
                analysis={selectedAnalysis} 
                loading={loadingProject === selectedProject.id} 
              />
            </div>
            
            {isVoiceOpen && (
              <VoiceSession 
                project={selectedProject}
                onClose={() => setIsVoiceOpen(false)}
              />
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-dim/50 space-y-4">
            <BrainCircuit className="w-12 h-12 opacity-20" />
            <p className="tracking-wide uppercase text-sm">Select or import material to begin</p>
          </div>
        )}
      </main>

      <aside className="w-96 flex flex-col bg-bg-deep relative z-0">
        <div className="h-16 shrink-0 border-b border-border-main flex items-center px-6 gap-3">
          <MessageSquare className="w-4 h-4 text-text-dim" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-dim">Development Frame</h2>
        </div>
        {selectedProject ? (
          <Chat 
            project={selectedProject} 
            isOpen={true} 
            onClose={() => {}} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-text-dim/40 leading-relaxed border-t border-transparent">
            Awaiting project selection...
          </div>
        )}
      </aside>

      {isImporting && (
        <FileImport 
          onImport={onImport}
          onClose={() => setIsImporting(false)}
        />
      )}
    </div>
  );
}
