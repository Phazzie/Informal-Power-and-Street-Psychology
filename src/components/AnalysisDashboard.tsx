import React, { useState } from 'react';
import { AnalysisResult, AnalysisLens, Project } from '../types';
import { 
  Search, 
  Lightbulb, 
  Layers, 
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CoreMaterialTab } from './dashboard/CoreMaterialTab';
import { ConventionalTab } from './dashboard/ConventionalTab';
import { UnconventionalTab } from './dashboard/UnconventionalTab';

interface AnalysisDashboardProps {
  project: Project;
  analysis: AnalysisResult | null;
  loading: boolean;
}

export function AnalysisDashboard({ project, analysis, loading }: AnalysisDashboardProps) {
  const [activeLens, setActiveLens] = useState<AnalysisLens>('default');

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin" />
          <div className="absolute inset-4 border-b-2 border-white/20 rounded-full animate-spin-slow" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-white/50">Running Analytical Lenses</p>
          <p className="text-xs text-white/20 italic">"The context hides what the lines reveal..."</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center">
        <div className="max-w-md space-y-4">
          <Search className="w-12 h-12 text-white/10 mx-auto" />
          <h2 className="text-xl font-medium">Select a project to begin analysis</h2>
          <p className="text-sm text-white/40">
            The system will automatically scan conversations to surface recurring concepts, 
            striking statements, and candidate thesis lines.
          </p>
        </div>
      </div>
    );
  }

  const lenses: { id: AnalysisLens; label: string; icon: any }[] = [
    { id: 'default', label: 'Core Material', icon: Lightbulb },
    { id: 'conventional', label: 'Structure & Gaps', icon: Layers },
    { id: 'unconventional', label: 'Deep Intuition', icon: Sparkles },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-deep rounded-lg border section-border">
      {/* Tab Navigation */}
      <div className="flex border-b section-border bg-bg-surface">
        {lenses.map((lens) => (
          <button
            key={lens.id}
            onClick={() => setActiveLens(lens.id)}
            className={cn(
              "flex items-center gap-3 px-8 py-4 text-[0.75rem] font-bold uppercase tracking-wider transition-colors relative",
              activeLens === lens.id ? "text-accent-orange" : "text-text-dim hover:text-text-main"
            )}
          >
            <lens.icon className={cn("w-3.5 h-3.5", activeLens === lens.id ? "text-accent-orange" : "text-text-dim/50")} />
            {lens.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLens}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {activeLens === 'default' && <CoreMaterialTab analysis={analysis} />}
            {activeLens === 'conventional' && <ConventionalTab analysis={analysis} />}
            {activeLens === 'unconventional' && <UnconventionalTab analysis={analysis} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
