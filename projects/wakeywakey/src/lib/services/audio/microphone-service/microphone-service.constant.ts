/**
 * Audio sample rate
 */
export const SAMPLE_RATE = 16000;

/**
 * Audio worklet name
 */
export const MICROPHONE_PROCESSOR_NAME = 'microphone-buffer-processor';

/**
 * Audio worklet processor
 */
export const MICROPHONE_PROCESSOR = `
  class MicrophoneBufferProcessor extends AudioWorkletProcessor {
    // collect 1280 samples before sending them to the main thread
    // Web Audio processes 128 frames per call
    // batching 10 small chunks into 1 bigger chunk
    frameBlockSize = 128 * 10; // total samples per emitted chunk

    // for storing small chunks
    accumulatedSamples = new Float32Array(this.frameBlockSize);

    // cursor
    writeIndex = 0;

    constructor() {
      super();
    }

    dbNormalized(db) {
      const minDb = -60;
      const maxDb = 0;

      const clamped = Math.max(minDb, Math.min(db, maxDb));
      return (clamped - minDb) / (maxDb - minDb);
    }

    // runs every 128 frames. ~ every 2.67 ms (at 48kHz), ~ 8ms (at 16KHz)
    process(inputList) {
      const firstInput = inputList[0];

      // no input connected
      if (!firstInput || firstInput.length === 0) {
        return true;
      }

      // raw waveform values
      const firstChannelSamples = firstInput[0]; // Float32Array(128)

      let sum = 0;

      // 0 -> 128
      for (let i = 0; i < firstChannelSamples.length; i++) {
        // dump each sample in accumulated sample array
        this.accumulatedSamples[this.writeIndex++] = firstChannelSamples[i];
        sum += firstChannelSamples[i] * firstChannelSamples[i];
      }

      // once buffer is full, break
      if (this.writeIndex === this.frameBlockSize) {
        const rms = Math.sqrt(sum / firstChannelSamples.length);
        const db = 20 * Math.log10(rms ?? 0.00001);
        this.writeIndex = 0;

        // send to main thread
        this.port.postMessage({
          sample: this.accumulatedSamples.slice(),
          rms,
          db,
          dbNormalized: this.dbNormalized(db),
        });
      }

      return true;
    }
}

registerProcessor("${MICROPHONE_PROCESSOR_NAME}", MicrophoneBufferProcessor);
  `;
