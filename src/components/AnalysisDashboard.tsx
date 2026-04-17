import React, { useState } from 'react';
import { AnalysisResult, AnalysisLens, Project } from '../types';
import { 
  Search, 
  Lightbulb, 
  AlertCircle, 
  Layers, 
  BookOpen, 
  GitBranch, 
  Sparkles, 
  Heart, 
  Zap, 
  Milestone
} from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

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
            {activeLens === 'default' && (
              <>
                <Section title="Material Summary" icon={BookOpen} className="col-span-full">
                  <div className="glass-panel p-6 prose prose-invert max-w-none text-text-dim leading-relaxed font-sans text-sm">
                    <ReactMarkdown>{analysis.materialSummary}</ReactMarkdown>
                  </div>
                </Section>

                <Section title="The Author's Own Lines" icon={Zap} className="col-span-full">
                  <div className="space-y-4">
                    {analysis.authorLines.map((line, i) => (
                      <div key={i} className="glass-panel p-6">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div className="lens-name text-[0.7rem] uppercase font-bold text-accent-orange">Analysis / Line {i+1}</div>
                          <span className="text-[10px] font-bold text-accent-orange bg-accent-muted px-2 py-0.5 rounded">
                            Resonance: {line.resonance}/10
                          </span>
                        </div>
                        <p className="author-quote m-0 italic">"{line.line}"</p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="What's Underdeveloped" icon={AlertCircle} className="col-span-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.underdevelopedIdeas.map((idea, i) => (
                      <div key={i} className="glass-panel p-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-accent-orange text-[0.7rem] font-bold uppercase tracking-widest">DROPPED PATTERN</span>
                        </div>
                        <h4 className="text-text-main font-bold text-sm tracking-tight">{idea.concept}</h4>
                        <div className="space-y-2">
                          <div className="text-[0.75rem] text-text-dim/60 italic leading-snug">
                            <span className="text-accent-muted not-italic font-bold text-[0.65rem] uppercase mr-2.5">Initial Intro</span>
                            {idea.initialIntroduction}
                          </div>
                          <div className="text-[0.75rem] text-text-dim leading-relaxed">
                            <span className="text-accent-muted font-bold text-[0.65rem] uppercase mr-2.5">Gap</span>
                            {idea.lackOfFollowThrough}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {activeLens === 'conventional' && (
              <>
                <Section title="Concept Frequency Map" icon={Layers}>
                  <div className="glass-panel p-6 prose prose-invert prose-sm max-w-none text-text-dim">
                    <ReactMarkdown>{analysis.conventional.conceptMap}</ReactMarkdown>
                  </div>
                </Section>

                <Section title="Story Inventory" icon={Milestone}>
                  <div className="glass-panel p-6 prose prose-invert prose-sm max-w-none text-text-dim">
                    <ReactMarkdown>{analysis.conventional.storyInventory}</ReactMarkdown>
                  </div>
                </Section>

                <Section title="Gap Analysis" icon={Search} className="col-span-full">
                  <div className="glass-panel p-6 border-l-4 border-l-accent-muted prose prose-invert prose-sm max-w-none text-text-dim">
                    <ReactMarkdown>{analysis.conventional.gapAnalysis}</ReactMarkdown>
                  </div>
                </Section>
              </>
            )}

            {activeLens === 'unconventional' && (
              <>
                <Section title="Throwaway Line Detector" icon={Zap} className="col-span-full">
                  <div className="space-y-4">
                    {analysis.unconventional.throwawayLines.map((line, i) => (
                      <div key={i} className="glass-panel p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="lens-name text-[0.7rem] uppercase font-bold text-accent-orange tracking-widest">SIDELONG INSIGHT</div>
                          <div className="thesis-badge">THESIS CANDIDATE</div>
                        </div>
                        <p className="author-quote m-0">"{line}"</p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Emotional Spine" icon={Heart}>
                  <div className="glass-panel p-6 prose prose-invert prose-sm max-w-none text-text-dim">
                    <ReactMarkdown>{analysis.unconventional.emotionalSpine}</ReactMarkdown>
                  </div>
                </Section>

                <Section title="Contradiction Finder" icon={GitBranch}>
                  <div className="glass-panel p-6 prose prose-invert prose-sm max-w-none text-text-dim">
                    <ReactMarkdown>{analysis.unconventional.contradictions}</ReactMarkdown>
                  </div>
                </Section>

                <Section title="Candidate Thesis Generator" icon={Sparkles} className="col-span-full">
                  <div className="space-y-6">
                    {analysis.unconventional.candidateTheses.map((thesis, i) => (
                      <div key={i} className="glass-panel p-8 space-y-4 border-t-2 border-t-accent-muted">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
                            <div className="text-[0.7rem] uppercase font-bold text-accent-orange">Candidate {i+1}</div>
                          </div>
                          <div className="thesis-badge text-[0.6rem]">SIDELONG INSIGHT</div>
                        </div>
                        <h4 className="text-xl font-normal text-white leading-snug tracking-tight">"{thesis.statement}"</h4>
                        
                        <div className="space-y-4 pt-4 border-t section-border">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-text-dim/40 mb-2">Original Context</p>
                            <p className="text-[0.85rem] text-text-dim/60 italic leading-relaxed font-serif">
                              ...{thesis.originalContext}...
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-text-dim/40 mb-2">Supportive Evidence</p>
                            <p className="text-[0.85rem] text-text-dim leading-relaxed">{thesis.support}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, className }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3 px-2">
        <Icon className="w-4 h-4 text-accent-orange opacity-60" />
        <h3 className="text-[0.75rem] font-bold uppercase tracking-widest text-text-dim/60">{title}</h3>
      </div>
      {children}
    </div>
  );
}
