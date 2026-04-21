import { useState, useRef, useEffect, useCallback } from 'react';
import { floatTo16BitPCM, arrayBufferToBase64 } from '../lib/audioUtils';
import { Project } from '../types';
import { exportAuthorVoice } from '../utils/parser';
import { useDependencies } from '../core/di/DIContext';

export function useLiveAudio(project: Project) {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string, role: string }[]>([]);
  
  const { media, realtime } = useDependencies();

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextAudioTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const rawStreamRef = useRef<MediaStream | null>(null);

  const stopAllPlayback = useCallback(() => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current = [];
    if (audioContextRef.current) {
      nextAudioTimeRef.current = audioContextRef.current.currentTime;
    }
  }, []);

  const playAudio = useCallback((base64: string) => {
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
  }, []);

  const startSession = async () => {
    const authorVoice = exportAuthorVoice(project);

    try {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      nextAudioTimeRef.current = audioContextRef.current.currentTime;

      sessionRef.current = realtime.startLiveSession(project.name, authorVoice.slice(0, 50000), {
        onAudioData: playAudio,
        onTranscription: (text, role) => {
          setTranscript(prev => [...prev, { text, role }]);
        },
        onInterrupted: stopAllPlayback,
        onClose: () => setIsActive(false),
        onError: (err) => console.error("Live API Error:", err)
      });

      const stream = await media.requestMicrophone();
      rawStreamRef.current = stream;
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
          data: base64, mimeType: 'audio/pcm;rate=16000'
        });
      };

      setIsActive(true);
    } catch (err) {
      console.error("Failed to start voice session:", err);
    }
  };

  const endSession = useCallback(() => {
    sessionRef.current?.close();
    audioContextRef.current?.close();
    if (rawStreamRef.current) {
      media.releaseStream(rawStreamRef.current);
      rawStreamRef.current = null;
    }
    setIsActive(false);
  }, [media]);

  useEffect(() => {
    return endSession;
  }, [endSession]);

  return { isActive, transcript, startSession, endSession };
}
