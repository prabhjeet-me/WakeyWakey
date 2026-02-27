import { Component } from '@angular/core';
import {
  WakeyWakeyAudioUtil,
  WakeyWakeyBridgeService,
  WakeyWakeyComponent,
  WakeyWakeyRecordingEvent,
  WakeyWakeySilenceEvent,
  WakeyWakeySpeechEvent,
  WakeyWakeyWordEvent,
} from 'wakeywakey';

@Component({
  selector: 'app-root',
  imports: [WakeyWakeyComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { ngSkipHydration: 'true' },
})
export class App {
  vadScore = 0;
  rms = 0;
  db = 0;
  i = 0;

  exception(error: Error) {
    console.error(error);
  }

  wakeword(ev: WakeyWakeyWordEvent) {
    this.wavBlobUrl('WakeWord', WakeyWakeyAudioUtil.createWavBlob(ev.chunk!)!);
  }

  silence(ev: WakeyWakeySilenceEvent) {
    this.wavBlobUrl('Silence: ' + ev.transcript, WakeyWakeyAudioUtil.createWavBlob([ev.chunk])!);
  }

  speech(ev: WakeyWakeySpeechEvent) {
    this.vadScore = ev.vadScore;
    this.rms = ev.rms;
    this.db = ev.dbNormalized;
  }

  log(ev: unknown) {
    console.log(ev);
  }

  recording(ev: WakeyWakeyRecordingEvent) {
    if (ev.transcript) console.log(ev.transcript);
  }

  ready(ev: WakeyWakeyBridgeService) {
    console.log(ev);
  }

  wavBlobUrl(text: string, audioUrl?: string) {
    const debugAudioContainer = document.getElementById('debug-audio');

    const clipContainer = document.createElement('div');

    if (audioUrl) {
      const audioElement = document.createElement('audio');
      audioElement.controls = true;
      audioElement.src = audioUrl;
      clipContainer.appendChild(audioElement);
    }

    const clipTitle = document.createElement('p');
    clipTitle.textContent = `${text}`;
    clipContainer.appendChild(clipTitle);

    debugAudioContainer!.appendChild(clipContainer);
  }
}
