import { Project, AnalysisResult } from "../types";
import { exportAuthorVoice } from "../utils/parser";

export async function analyzeProject(project: Project): Promise<AnalysisResult> {
  const authorVoice = exportAuthorVoice(project);
  
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorVoice })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to analyze project material.');
  }

  return await res.json() as AnalysisResult;
}

export async function* chatWithProject(project: Project, history: any[], message: string) {
  const authorVoice = exportAuthorVoice(project);
  
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      authorVoice, 
      projectName: project.name, 
      message, 
      history 
    })
  });

  if (!res.ok || !res.body) {
    throw new Error('Failed to chat.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}
