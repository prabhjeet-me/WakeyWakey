import { inject, Injectable } from '@angular/core';
import { Tensor } from 'onnxruntime-web';
import { SpeechEvent } from '../event/event-service.type';
import { ModelService } from '../model/model-service';

@Injectable()
export class PipelineService {
  /**
   * Dependencies
   */
  private readonly _model = inject(ModelService);

  // Configuration Constants
  private readonly MEL_WINDOW_SIZE = 76; // Number of mel frames needed for one embedding
  private readonly MEL_HOP_SIZE = 8; // How many frames to skip (the slide) after inference
  private readonly EMBEDDING_COUNT = 16; // Number of embeddings kept in memory (temporal context)
  private readonly FEATURE_DIM = 96; // Size of each embedding vector
  private readonly MEL_BINS = 32; // Number of frequency bins per mel frame

  /**
   * Historical buffer of embeddings representing the last ~1-2 seconds of audio context.
   * Initialized with empty (zero) vectors.
   */
  private readonly _embeddingQueue = Array.from({ length: this.EMBEDDING_COUNT }, () =>
    new Float32Array(this.FEATURE_DIM).fill(0),
  );

  /**
   * Buffer of calculated Mel Spectrogram frames waiting to be processed.
   */
  private readonly _melFrameQueue: Float32Array[] = [];

  /**
   * Main entry point: Processes a new chunk of audio and returns a detection score.
   */
  async run(speech: SpeechEvent): Promise<number> {
    // 1. Convert raw PCM audio into Mel Spectrogram frames and add to queue
    await this._generateMelSpectrogram(speech.sample);

    let latestScore = 0;

    // 2. Process the queue using a sliding window approach
    // While we have enough frames to form a full input window (76 frames)...
    while (this._melFrameQueue.length >= this.MEL_WINDOW_SIZE) {
      // Extract a single feature vector (embedding) from the current window
      const combinedEmbeddings = await this._processWindowToEmbeddings();

      // Classify the sequence of embeddings to see if the wake-word is present
      latestScore = await this._getWakeWordScore(combinedEmbeddings);

      // Slide the window: Remove the oldest 8 frames to make room for new audio
      this._melFrameQueue.splice(0, this.MEL_HOP_SIZE);
    }

    return latestScore;
  }

  /**
   * STAGE 1: Converts raw audio samples into Mel Frequency bins.
   */
  private async _generateMelSpectrogram(samples: Float32Array) {
    const session = this._model.melSpectrogram;

    // Wrap raw audio in an ONNX Tensor [Batch: 1, Samples: N]
    const inputTensor = new Tensor('float32', samples, [1, samples.length]);

    // Run the Mel-Spectrogram model
    const output = await session.run({ [session.inputNames[0]]: inputTensor });
    const rawMelData = output[session.outputNames[0]].data as Float32Array;

    /**
     * Post-processing & Normalization:
     * The model output is scaled to fit the expected input range of the embedding model.
     * Logic: (value / 10) + 2.0
     */
    const normalizedMel = rawMelData.map((val) => val / 10.0 + 2.0);

    // Slice the flat output array into individual frames of 32 bins and queue them
    // Each inference usually produces 5 frames for the given 1280 audio samples
    for (let i = 0; i < 5; i++) {
      const start = i * this.MEL_BINS;
      const end = start + this.MEL_BINS;
      this._melFrameQueue.push(normalizedMel.subarray(start, end));
    }
  }

  /**
   * STAGE 2: Extracts features (embeddings) from a window of Mel frames.
   */
  private async _processWindowToEmbeddings(): Promise<Float32Array> {
    const session = this._model.embedding!;

    // Take the first 76 frames from our queue
    const windowFrames = this._melFrameQueue.slice(0, this.MEL_WINDOW_SIZE);

    // Flatten the frames into a single continuous array for the Tensor
    const flattenedInput = new Float32Array(this.MEL_WINDOW_SIZE * this.MEL_BINS);
    windowFrames.forEach((frame, i) => {
      flattenedInput.set(frame, i * this.MEL_BINS);
    });

    // Run the Embedding model [1, 76, 32, 1]
    const inputTensor = new Tensor('float32', flattenedInput, [1, 76, 32, 1]);
    const output = await session.run({ [session.inputNames[0]]: inputTensor });
    const newEmbedding = output[session.outputNames[0]].data as Float32Array;

    // Update the rolling embedding queue (First-In, First-Out)
    this._embeddingQueue.shift();
    this._embeddingQueue.push(new Float32Array(newEmbedding));

    // Flatten the last 16 embeddings into one large vector for the final classifier
    const combinedBuffer = new Float32Array(this.EMBEDDING_COUNT * this.FEATURE_DIM);
    this._embeddingQueue.forEach((emb, i) => {
      combinedBuffer.set(emb, i * this.FEATURE_DIM);
    });

    return combinedBuffer;
  }

  /**
   * STAGE 3: Final classification score based on temporal embedding sequence.
   */
  private async _getWakeWordScore(embeddings: Float32Array): Promise<number> {
    const session = this._model.wakeword;

    // Shape: [Batch: 1, Sequence: 16, Features: 96]
    const inputTensor = new Tensor('float32', embeddings, [
      1,
      this.EMBEDDING_COUNT,
      this.FEATURE_DIM,
    ]);

    const results = await session.run({ [session.inputNames[0]]: inputTensor });

    // Extract the scalar probability score from the output tensor
    return results[session.outputNames[0]].data[0] as number;
  }
}
