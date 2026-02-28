import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideWakeyWakey } from 'wakeywakey';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // provideClientHydration(withEventReplay()),
    provideWakeyWakey({
      audio: {
        gain: 1,
        noiseSuppression: {
          rnnBased: true,
          nativeNoiseSuppression: true,
          nativeEchoCancellation: true,
          autoGainControl: false,
        },
        speechThresholdTime: 300,
      },
      orb: {
        size: 400,
      },
      onnx: {
        model: {
          wakeword: '/wakeywakey/models/alexa_v0.1.onnx',
        },
        wakeword: ['alexa'],
      },
      mode: 'VOICE_CHAT',
    }),
  ],
};
