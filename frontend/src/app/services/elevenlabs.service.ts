import axios from 'axios';

export async function fetchSpeech(text: string): Promise<string> {
  const { data } = await axios.post(
    '/api/elevenlabs/speech',
    { text },
    { responseType: 'blob' },
  );
  return URL.createObjectURL(data as Blob);
}
