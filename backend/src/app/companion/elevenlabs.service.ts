import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly client: ElevenLabsClient;
  private readonly defaultVoiceId: string;
  private readonly modelId: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.getOrThrow<string>('ELEVENLABS_API_KEY');
    this.defaultVoiceId = this.config.getOrThrow<string>('ELEVENLABS_VOICE_ID');
    this.modelId = this.config.get<string>(
      'ELEVENLABS_MODEL_ID',
      'eleven_flash_v2_5',
    );
    this.client = new ElevenLabsClient({ apiKey });
    this.logger.log(`ElevenLabs ready (model: ${this.modelId})`);
  }

  async textToSpeech(text: string, voiceId?: string) {
    return this.client.textToSpeech.stream(voiceId ?? this.defaultVoiceId, {
      text,
      modelId: this.modelId,
    });
  }

  async getVoices() {
    return this.client.voices.search();
  }
}
