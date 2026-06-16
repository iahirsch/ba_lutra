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

    let cancelled = false;
    let audioEl: HTMLAudioElement | null = null;
    let bufferSource: AudioBufferSourceNode | null = null;
    let gainNode: GainNode | null = null;

    const run = async () => {
      const ctx = getAudioContext();

      if (DYNAMIC_AUDIO_STEP_IDS.has(stepId)) {
        // TTS path: use decodeAudioData + AudioBufferSourceNode so gain is
        // guaranteed to be 0.001 before the first sample plays — no render-
        // quantum window where the GainNode default of 1.0 could leak through.
        const arrayBuffer = await fetchSpeech(dialogue);
        if (cancelled) return;

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        source.connect(gain);
        gain.connect(ctx.destination);

        bufferSource = source;
        gainNode = gain;

        if (cancelled) return;

        const startAt = ctx.currentTime + 0.01;
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.exponentialRampToValueAtTime(1, startAt + FADE_S);
        source.start(startAt);
      } else {
        // Static MP3 path: keep HTMLAudioElement, fix gain init to avoid the
        // same render-quantum gap.
        const src = `/assets/audio/${stepId}.mp3`;
        const el = new Audio(src);
        const source = ctx.createMediaElementSource(el);
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        source.connect(gain);
        gain.connect(ctx.destination);

        audioEl = el;
        gainNode = gain;

        if (cancelled) return;

        await el.play();
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(1, now + FADE_S);
      }
    };

    run().catch(() => {});

    return () => {
      cancelled = true;
      const el = audioEl;
      const source = bufferSource;
      const gain = gainNode;

      if (gain) {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + FADE_S);
        setTimeout(() => {
          if (el) {
            el.pause();
            el.src = '';
          }
          if (source) {
            try { source.stop(); } catch {}
          }
        }, FADE_S * 1000 + 20);
      }
    };
  }, [stepId, dialogue]);
}
