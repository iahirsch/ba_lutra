import { useEffect } from 'react';
import { fetchSpeech } from '../services/elevenlabs.service';

const DYNAMIC_AUDIO_STEP_IDS = new Set(['firstLook', 'activity_finished']);

export function useCompanionAudio(
  stepId: string | undefined,
  dialogue: string | undefined,
): void {
  useEffect(() => {
    if (!stepId || !dialogue) return;

    let audio: HTMLAudioElement | null = null;
    let blobUrl: string | null = null;
    let cancelled = false;

    const play = async () => {
      if (DYNAMIC_AUDIO_STEP_IDS.has(stepId)) {
        blobUrl = await fetchSpeech(dialogue);
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
      }

      const src = blobUrl ?? `/assets/audio/${stepId}.mp3`;
      audio = new Audio(src);
      await audio.play();
    };

    play().catch(() => {});

    return () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [stepId, dialogue]);
}
