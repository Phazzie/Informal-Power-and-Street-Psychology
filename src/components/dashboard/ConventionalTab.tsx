import React from 'react';
import { AnalysisResult } from '../../types';
import ReactMarkdown from 'react-markdown';
import { Section } from './Section';
import { Layers, Search, Milestone } from 'lucide-react';

export function ConventionalTab({ analysis }: { analysis: AnalysisResult }) {
  return (
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
  );
}
