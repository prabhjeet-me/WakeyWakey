import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideWakeyWakey } from 'wakeywakey';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideWakeyWakey({
      audio: {
        gain: 1,
        path: {
          upSound: './sounds/up.mp3',
          downSound: './sounds/down.mp3',
        },
        noiseSuppression: true,
      },
      orb: {
        size: 400,
      },
      onnx: {
        runtimePath: '/ort/',
        model: {
          melspectrogram: './models/melspectrogram.onnx',
          embedding: './models/embedding_model.onnx',
          silero_vad: './models/silero_vad_v4.onnx',
          wakeword: './models/hey_jarvis_v0.1.onnx',
        },
      },
    }),
  ],
};
