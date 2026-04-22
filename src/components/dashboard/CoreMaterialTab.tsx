import React from 'react';
import { AnalysisResult } from '../../types';
import ReactMarkdown from 'react-markdown';
import { Section } from './Section';
import { BookOpen, Zap, AlertCircle } from 'lucide-react';

export function CoreMaterialTab({ analysis }: { analysis: AnalysisResult }) {
  return (
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
  );
}
