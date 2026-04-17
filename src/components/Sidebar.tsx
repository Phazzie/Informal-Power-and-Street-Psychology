import React from 'react';
import { Project } from '../types';
import { FolderOpen, FileJson, ChevronRight, Binary } from 'lucide-react';
import { cn } from '../lib/utils'; // I'll create this helper

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onImport: () => void;
}

export function Sidebar({ projects, selectedProjectId, onSelectProject, onImport }: SidebarProps) {
  return (
    <div className="w-full h-full flex flex-col bg-bg-surface">
      <div className="py-6">
        <div className="nav-label px-6 pb-3 text-[0.7rem] uppercase tracking-[0.1em] text-text-dim">
          Active Projects
        </div>
        
        <div className="flex-1 overflow-y-auto pb-6">
          {projects.length === 0 ? (
            <div className="px-6 py-8">
              <p className="text-xs text-text-dim/50 italic">
                No sessions parsed yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={cn(
                    "w-full text-left px-6 py-3 text-[0.9rem] transition-all border-l-2 cursor-pointer",
                    selectedProjectId === p.id 
                      ? "bg-bg-card border-accent-orange text-text-main" 
                      : "border-transparent text-text-dim hover:text-text-main hover:bg-bg-card/50"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="nav-label px-6 pb-3 text-[0.7rem] uppercase tracking-[0.1em] text-text-dim">
            Saved Lenses
          </div>
          <div className="flex flex-col opacity-50 cursor-not-allowed">
            <div className="px-6 py-2 text-[0.9rem]">Emotional Spine (All)</div>
            <div className="px-6 py-2 text-[0.9rem]">Gap Analysis Repository</div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 border-t section-border">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-orange animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-text-dim/40">
            Engine Connected
          </span>
        </div>
      </div>
    </div>
  );
}
