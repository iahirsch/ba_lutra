import axios from 'axios';

export async function fetchSpeech(text: string): Promise<ArrayBuffer> {
  const { data } = await axios.post(
    '/api/elevenlabs/speech',
    { text },
    { responseType: 'arraybuffer' },
  );
  return data as ArrayBuffer;
}
