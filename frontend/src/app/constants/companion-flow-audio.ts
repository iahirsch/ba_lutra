const STEP_AUDIO_MAP: Partial<Record<string, string>> = {
  greeting: '/assets/audio/greeting.mp3',
  team_intro: '/assets/audio/team_intro.mp3',
  worldbuilding_teaser: '/assets/audio/worldbuilding_teaser.mp3',
  handover_vision: '/assets/audio/handover_vision.mp3',
  usp_1: '/assets/audio/usp_1.mp3',
  usp_2: '/assets/audio/usp_2.mp3',
  laura_funny: '/assets/audio/laura_funny.mp3',
  gameplay_remark: '/assets/audio/gameplay_remark.mp3',
  world_chapter: '/assets/audio/world_chapter.mp3',
  world_chapter_conduit: '/assets/audio/world_chapter_conduit.mp3',
  companion_thanks: '/assets/audio/companion_thanks.mp3',
  app_features: '/assets/audio/app_features.mp3',
  funfact: '/assets/audio/funfact.mp3',
  activity_finished: '/assets/audio/activity_finished.mp3',
  store_energy_3: '/assets/audio/store_energy_3.mp3',
  farewell_1: '/assets/audio/farewell_1.mp3',
  farewell_2: '/assets/audio/farewell_2.mp3',
  // store_energy_3: '/assets/audio/win.mp3',
};

export function resolveStepAudio(stepId: string): string | null {
  return STEP_AUDIO_MAP[stepId] ?? null;
}
