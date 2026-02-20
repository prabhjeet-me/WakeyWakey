# WakeyWakey

This project implements a sophisticated, multi-stage Audio Intelligence Pipeline designed to detect specific "Wake Words" (e.g., "Hey Jarvis") directly within a web browser. By leveraging ONNX Runtime Web, the system performs high-performance machine learning inference locally on the user's device, ensuring low latency and enhanced privacy.

## Usage

```typescript
// app.config.ts
provideWakeyWakey({
  audio: {
    gain: 1, // audio gain
    path: {
      upSound: './sounds/up.mp3',   // path sound to play when wakeword is detected
      downSound: './sounds/down.mp3',   // path sound to play when silence is emitted
    },
    silenceDuration: 1500 // in ms, wait after silence is detected
    vadThreshold: 0.5 // 0-1, threshold above which voice activity is considered
  },
  orb: {
    size: 400,  // orb size
  },
  onnx: {
    runtimePath: '/ort/',   // onnx runtime directory
    wakewordInferenceThreshold: 0.5 // classification score threshold to consider wakeword
    model: {
      melspectrogram: './models/melspectrogram.onnx',
      embedding: './models/embedding_model.onnx',
      silero_vad: './models/silero_vad_v4.onnx',
      wakeword: './models/hey_jarvis_v0.1.onnx',
    },
  },
}),
```

```html
<!-- your-component.html -->
<wakeywakey
  (speech)="speech($event)"
  (exception)="exception($event)"
  (wakeword)="wakeword($event)"
  (ready)="ready()"
  (recording)="recording()"
  (silence)="silence($event)"
></wakeywakey>
```

```json
// angular.json "assets"
{
  "glob": "**/*",
  "input": "node_modules/onnxruntime-web/dist/",
  "output": "ort"
},
{
  "glob": "**/*",
  "input": "node_modules/@prabhjeet-me/wakeywakey/assets",
  "output": "."
}
```

### WakeyWakey Component

Below is the list of items that are emitted by this library

- **(speech)**: Fires every 8ms (for 16KHz), contains VAD score, 1280 frames sample, decibel etc
- **(exception)**: Fires when an exception is thrown
- **(wakeword)**: Fires when wakeword is detected, contains chunk (spoken samples), inference score etc
- **(ready)**: Fires when library is ready
- **(recording)**: Fires when recording is started after wakeword is detected
- **(silence)**: Fires when silence is detected after recording starts

## Core Architecture

The system processes raw audio through a three-tier "Deep Learning" stack:

### Signal Processing (Acoustic Analysis)

Converts raw 1D audio samples into a Mel-Spectrogram. This transforms sound into a time-frequency heat map, normalizing the data to highlight the features most relevant to human speech.

### Feature Extraction (Neural Embeddings)

Uses a Sliding Window approach (76 frames per window) to analyze the spectrogram. A dedicated embedding model compresses these complex visual patterns into dense 96-dimensional feature vectors that represent the "essence" of the audio snippet.

### Sequence Classification (Temporal Analysis)

Maintains a rolling "memory" of the last 16 embeddings. A final classification model analyzes this temporal sequence to determine the probability of a wake word being spoken.

## Key Technical Features

- Real-Time Sliding Window: Processes audio in overlapping chunks (hops) to ensure no words are "cut in half" at the edge of a buffer.
- Intelligent Debouncing: Includes a built-in throttle time and Buffer-Reset mechanism to prevent "double-firing" or multiple notifications for a single spoken phrase.
- Browser-Native Performance: Optimized for the web using TypedArrays (Float32Array) and Tensor operations, minimizing the overhead of the JavaScript garbage collector.
- Edge AI Design: By running models locally via onnxruntime-web, the project eliminates the need for expensive server-side audio processing and functions entirely offline.

## Technical Stack

- Framework: Angular (Injectable Service Architecture).
- Inference Engine: ONNX Runtime Web.
- Data Processing: NumPy-style array manipulation in TypeScript.
- Models: Specialized Mel-Spectrogram, Embedding, and Wake-word Classifier models.

## OpenWakeWord

Special thanks to [openWakeWord](https://github.com/dscripka/openWakeWord) for the inspiration of this project. This project works on the architecture similar to openWakeWord.
