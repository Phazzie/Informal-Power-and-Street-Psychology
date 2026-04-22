import React from 'react';
import { AnalysisResult } from '../../types';
import ReactMarkdown from 'react-markdown';
import { Section } from './Section';
import { Heart, GitBranch, Sparkles, Zap } from 'lucide-react';

export function UnconventionalTab({ analysis }: { analysis: AnalysisResult }) {
  return (
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
  );
}
