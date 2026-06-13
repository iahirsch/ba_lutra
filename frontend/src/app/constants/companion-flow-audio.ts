const STEP_AUDIO_MAP: Partial<Record<string, string>> = {
  greeting: '/assets/audio/greeting.mp3',
  // store_energy_3: '/assets/audio/win.mp3',
};

export function resolveStepAudio(stepId: string): string | null {
  return STEP_AUDIO_MAP[stepId] ?? null;
}
