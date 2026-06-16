import { useEffect } from 'react';
import { fetchSpeech } from '../services/elevenlabs.service';

const DYNAMIC_AUDIO_STEP_IDS = new Set(['firstLook', 'activity_finished']);

/** Fade duration in seconds — short enough to be imperceptible, long enough to kill click artifacts. */
const FADE_S = 0.04;

let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AudioContext();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

export function useCompanionAudio(
  stepId: string | undefined,
  dialogue: string | undefined,
): void {
  useEffect(() => {
    if (!stepId || !dialogue) return;

    let blobUrl: string | null = null;
    let cancelled = false;
    let audioEl: HTMLAudioElement | null = null;
    let gainNode: GainNode | null = null;

    const run = async () => {
      if (DYNAMIC_AUDIO_STEP_IDS.has(stepId)) {
        blobUrl = await fetchSpeech(dialogue);
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
          return;
        }
      }

      const src = blobUrl ?? `/assets/audio/${stepId}.mp3`;
      const ctx = getAudioContext();
      const el = new Audio(src);
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);

      audioEl = el;
      gainNode = gain;

      if (cancelled) return;

      await el.play();
      gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + FADE_S);
    };

    run().catch(() => {});

    return () => {
      cancelled = true;
      const el = audioEl;
      const gain = gainNode;
      const url = blobUrl;
      blobUrl = null;

      if (el && gain) {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + FADE_S);
        setTimeout(() => {
          el.pause();
          el.src = '';
          if (url) URL.revokeObjectURL(url);
        }, FADE_S * 1000 + 20);
      } else {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [stepId, dialogue]);
}
