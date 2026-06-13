import { useEffect, useRef } from 'react';
import { resolveStepAudio } from '../constants/companion-flow-audio';

/**
 * Plays a step-specific audio file whenever `stepId` changes.
 * Stops and discards any previously playing clip before starting the next one.
 */
export function useFlowAudio(stepId: string | null | undefined): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!stepId) return;

    const src = resolveStepAudio(stepId);
    if (!src) return;

    const audio = new Audio(src);
    audioRef.current = audio;

    audio.play().catch(() => {
      // Autoplay may be blocked before the first user interaction; ignore silently.
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [stepId]);
}
