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
        noiseSuppression: {
          rnnBased: true,
        },
      },
      orb: {
        size: 400,
      },
      onnx: {
        model: {
          wakeword: '/wakeywakey/models/hey_jarvis_v0.1.onnx',
        },
      },
      mode: 'VOICE_CHAT',
    }),
  ],
};
