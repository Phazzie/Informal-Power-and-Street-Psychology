import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { Auth } from './Auth';

export function WelcomeView() {
  return (
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
  );
}
