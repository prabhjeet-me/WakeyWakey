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
  bridge!: WakeyWakeyBridgeService;

  get isMuted() {
    return this.bridge?.mic.isMuted || false;
  }

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

  muteUnmute() {
    this.bridge.mic.isMuted = !this.bridge.mic.isMuted;
  }

  async play() {
    try {
      // 1. Fetch the file
      const response = await fetch('/ok.mp3');
      const arrayBuffer = await response.arrayBuffer();

      // 2. Decode the compressed file (.mp3, .ogg, .wav) into raw audio
      const audioBuffer = await this.bridge!.mic.audioContext!.decodeAudioData(arrayBuffer);
      console.log('s');

      this.bridge.speaker.playAudioBuffer(audioBuffer);
    } catch (err) {
      console.error('Error decoding audio file:', err);
    }
  }

  async ready(ev: WakeyWakeyBridgeService) {
    this.bridge = ev;
    ev.mic.isMuted = true;
    // setTimeout(() => {
    // ev.event.wakeword.next({
    //   inferenceScore: 0,
    //   chunk: [],
    //   vadScore: 0,
    //   hasVoiceActivity: false,
    //   sample: new Float32Array(),
    //   rms: 0,
    //   db: 0,
    //   dbNormalized: 0,
    // });
    // ev.orbComponentService.setState('speaking');
    // ev.speaker.playAudio('/sound.mp3');
    // }, 5000);
    // ev.orbComponentService.setState('speaking');
    // ev.speaker.playAudio('/sound.mp3');
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
