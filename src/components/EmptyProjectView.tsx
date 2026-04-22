import React from 'react';
import { LayoutGrid } from 'lucide-react';

export function EmptyProjectView() {
  return (
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
  );
}
