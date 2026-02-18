import { SAMPLE_RATE } from './microphone-service/microphone-service.constant';

/**
 * Audio utility
 */
export class AudioUtil {
  /**
   * Create wav blob url from audio chunk
   *
   * @param chunks Audio chunk
   * @param sampleRate Sample rate
   * @returns
   */
  static createWavBlob(chunks: Float32Array[], sampleRate = SAMPLE_RATE) {
    const totalLength = chunks.reduce((len, chunk) => len + chunk.length, 0);
    if (!totalLength) return null;

    // Merge chunks
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      const s = Math.max(-1, Math.min(1, combined[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    const channels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.byteLength, true);

    const wavBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
    return URL.createObjectURL(wavBlob);
  }
}
