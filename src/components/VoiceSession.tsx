import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, Power } from 'lucide-react';
import { startLiveSession } from '../services/liveService';
import { floatTo16BitPCM, arrayBufferToBase64 } from '../lib/audioUtils';
import { Project } from '../types';
import { exportAuthorVoice } from '../utils/parser';

interface VoiceSessionProps {
  project: Project;
  onClose: () => void;
}

export function VoiceSession({ project, onClose }: VoiceSessionProps) {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string, role: string }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextAudioTimeRef = useRef<number>(0);

  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopAllPlayback = () => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current = [];
    if (audioContextRef.current) {
      nextAudioTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  const startSession = async () => {
    const authorVoice = exportAuthorVoice(project);

    try {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      nextAudioTimeRef.current = audioContextRef.current.currentTime;

      sessionRef.current = startLiveSession(project.name, authorVoice.slice(0, 50000), {
        onAudioData: (base64) => {
          playAudio(base64);
        },
        onTranscription: (text, role) => {
          setTranscript(prev => [...prev, { text, role }]);
        },
        onInterrupted: () => {
          stopAllPlayback();
        },
        onClose: () => setIsActive(false),
        onError: (err) => console.error("Live API Error:", err)
      });

      // Microphone Capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBuffer = floatTo16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcmBuffer);
        
        sessionRef.current.sendRealtimeInput({
          audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      setIsActive(true);
    } catch (err) {
      console.error("Failed to start voice session:", err);
    }
  };

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 0x8000;
    }

    const audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 16000);
    audioBuffer.getChannelData(0).set(floatData);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
    };
    audioSourcesRef.current.push(source);

    const startTime = Math.max(audioContextRef.current.currentTime, nextAudioTimeRef.current);
    source.start(startTime);
    nextAudioTimeRef.current = startTime + audioBuffer.duration;
  };

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
      sessionRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95">
      <div className="max-w-2xl w-full bg-bg-surface border border-border-main rounded-xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div className="p-6 border-b section-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-orange animate-pulse' : 'bg-text-dim/20'}`} />
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-text-main">VOICE-TO-VOICE SESSION</h2>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center text-center space-y-8">
          {!isActive ? (
            <>
              <div className="w-32 h-32 rounded-full bg-accent-orange/5 border border-accent-orange/20 flex items-center justify-center">
                <Mic className="w-12 h-12 text-accent-orange opacity-40" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl text-text-main">Enter Developmental Dialogue</h3>
                <p className="text-sm text-text-dim/60 max-w-sm">
                  This will initiate a low-latency voice connection. The editor will "listen" to your project material and respond to your voice in real-time.
                </p>
              </div>
              <button 
                onClick={startSession}
                className="bg-accent-orange text-white px-8 py-3 rounded-md font-bold text-[0.9rem] flex items-center gap-3 hover:brightness-110 transition-all uppercase tracking-widest"
              >
                <Power className="w-4 h-4" />
                Initialize Link
              </button>
            </>
          ) : (
            <div className="w-full space-y-12">
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full border-2 border-accent-orange animate-ping opacity-20 absolute" />
                  <div className="w-20 h-20 rounded-full bg-accent-orange flex items-center justify-center z-10">
                    <Volume2 className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-[0.65rem] uppercase font-bold tracking-[0.2em] text-accent-orange">Live Engine</span>
                </div>
              </div>

              <div className="max-w-md mx-auto h-48 overflow-y-auto space-y-4 text-left p-6 bg-bg-deep rounded-lg border border-border-main scrollbar-hide">
                 {transcript.length === 0 ? (
                   <p className="text-center text-text-dim/30 italic text-xs py-12">Waiting for interaction...</p>
                 ) : (
                   transcript.slice(-5).map((t, i) => (
                     <div key={i} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`text-[0.8rem] leading-relaxed p-3 rounded ${t.role === 'user' ? 'bg-accent-orange/10 text-text-main border-r-2 border-accent-orange' : 'text-text-dim'}`}>
                          {t.text}
                        </div>
                     </div>
                   ))
                 )}
              </div>
              
              <p className="text-[0.7rem] uppercase tracking-widest text-text-dim/40 italic">
                Audio is calibrated for 16kHz PCM. Processing subsurface patterns...
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t section-border bg-bg-card flex justify-center">
           {isActive && (
             <button 
              onClick={() => {
                sessionRef.current?.close();
                audioContextRef.current?.close();
                setIsActive(false);
              }}
              className="text-text-dim/40 hover:text-red-500 transition-colors flex items-center gap-2 uppercase text-[0.7rem] font-bold tracking-widest"
             >
               <MicOff className="w-4 h-4" />
               Disconnect Engine
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
