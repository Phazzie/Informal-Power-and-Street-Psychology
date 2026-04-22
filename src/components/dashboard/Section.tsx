import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface SectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, icon: Icon, children, className }: SectionProps) {
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
