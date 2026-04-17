import React, { useRef } from 'react';
import { Upload, X, ShieldAlert } from 'lucide-react';
import { parseClaudeExport } from '../utils/parser';
import { Project } from '../types';

interface FileImportProps {
  onImport: (projects: Project[]) => void;
  onClose: () => void;
}

export function FileImport({ onImport, onClose }: FileImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const projects = parseClaudeExport(json);
        onImport(projects);
      } catch (err) {
        alert("Invalid JSON file. Please provide a standard Claude conversation export.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
      <div className="max-w-xl w-full bg-bg-surface border border-border-main rounded-lg shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent-orange" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/5 text-text-dim/40 hover:text-text-main transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-12 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-normal tracking-tight text-text-main">INGEST MATERIAL</h2>
            <p className="text-[0.85rem] text-text-dim max-w-sm mx-auto leading-relaxed">
              Drop your Claude .json export here. The engine will parse your sessions and re-calibrate current lenses.
            </p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border border-border-main bg-bg-deep p-16 text-center cursor-pointer transition-all group hover:border-accent-orange/40"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-8 h-8 text-accent-orange opacity-40 group-hover:opacity-100 transition-opacity" />
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-text-dim/40 group-hover:text-text-main transition-colors">
                Select File System
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-5 bg-bg-card border border-border-main rounded">
            <ShieldAlert className="w-4 h-4 text-accent-orange shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-accent-orange">Analysis / Sandbox</p>
              <p className="text-[0.75rem] text-text-dim leading-relaxed opacity-60">
                All pattern parsing happens within the isolated engine context. Your material is not retained beyond the session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
