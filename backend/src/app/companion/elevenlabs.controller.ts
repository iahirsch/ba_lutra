import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Readable } from 'stream';
import { ElevenLabsService } from './elevenlabs.service';
import { Speech } from './dto/speech.dto';

@ApiTags('elevenlabs')
@Controller('elevenlabs')
export class ElevenLabsController {
  constructor(private readonly elevenLabsService: ElevenLabsService) {}

  @Post('speech')
  @ApiOperation({
    summary: 'Convert text to speech, returns audio/mpeg stream',
  })
  async speech(
    @Body() body: Speech,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const audioStream = await this.elevenLabsService.textToSpeech(
      body.text,
      body.voiceId,
    );
    res.set({ 'Content-Type': 'audio/mpeg', 'Transfer-Encoding': 'chunked' });
    return new StreamableFile(
      Readable.from(audioStream as unknown as AsyncIterable<Uint8Array>),
    );
  }

  @Get('voices')
  @ApiOperation({ summary: 'List available ElevenLabs voices' })
  getVoices() {
    return this.elevenLabsService.getVoices();
  }
}
