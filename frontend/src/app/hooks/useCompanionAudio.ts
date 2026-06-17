import { useEffect } from 'react';
import { fetchSpeech } from '../services/elevenlabs.service';

const DYNAMIC_AUDIO_STEP_IDS = new Set(['firstLook', 'store_energy_3']);

const FADE_S = 0.04;

let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AudioContext();
    const warmup = _ctx.createBufferSource();
    warmup.buffer = _ctx.createBuffer(1, 1, _ctx.sampleRate);
    warmup.connect(_ctx.destination);
    warmup.start(0);
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => undefined);
  }
  return _ctx;
}

/** Module-level cache of decoded AudioBuffers keyed by dialogue text. */
const _bufferCache = new Map<string, Promise<AudioBuffer>>();

/**
 * Kick off the TTS fetch + decode for the given dialogue and store it in the
 * cache. Call this as early as possible (e.g. during a loading animation) so
 * the buffer is ready by the time audio actually needs to play.
 */
export function preloadSpeech(dialogue: string): Promise<AudioBuffer> {
  const cached = _bufferCache.get(dialogue);
  if (cached) return cached;
  const ctx = getAudioContext();
  const promise = fetchSpeech(dialogue).then((ab) => ctx.decodeAudioData(ab));
  _bufferCache.set(dialogue, promise);
  return promise;
}

export function useCompanionAudio(
  stepId: string | undefined,
  dialogue: string | undefined,
): void {
  useEffect(() => {
    if (!stepId) return;
    const isDynamic = DYNAMIC_AUDIO_STEP_IDS.has(stepId);
    if (isDynamic && !dialogue) return;

    let cancelled = false;
    let audioEl: HTMLAudioElement | null = null;
    let bufferSource: AudioBufferSourceNode | null = null;
    let gainNode: GainNode | null = null;

    const run = async () => {
      const ctx = getAudioContext();

      if (isDynamic) {
        const audioBuffer = await preloadSpeech(dialogue as string);
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

        const startAt =
          ctx.currentTime + Math.max((ctx.baseLatency ?? 0) * 2, 0.1);
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.exponentialRampToValueAtTime(1, startAt + FADE_S);
        source.start(startAt);
      } else {
        let src: string;
        if (
          stepId === 'moreInfo' &&
          dialogue === 'Was möchtest du sonst noch erfahren?'
        ) {
          src = `/assets/audio/moreInfo_visited.mp3`;
        } else {
          src = `/assets/audio/${stepId}.mp3`;
        }
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
        if (cancelled) return;
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(1, now + FADE_S);
      }
    };

    run().catch(() => undefined);

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
        setTimeout(
          () => {
            if (el) {
              el.pause();
              el.src = '';
            }
            if (source) {
              try {
                source.stop();
              } catch {
                /* source may already be stopped */
              }
            }
          },
          FADE_S * 1000 + 20,
        );
      }
    };
  }, [stepId, dialogue]);
}
