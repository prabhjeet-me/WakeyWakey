import { inject, Injectable, OnDestroy } from '@angular/core';
import { throttleTime } from 'rxjs';
import { SubSink } from 'subsink';
import { OrbComponentService } from '../../../components/orb-component/orb-component-service';
import { ConfigService } from '../../config/config-service';
import { EventService } from '../../event/event-service';
import { PlatformService } from '../../platform/platform-service';
import { AudioService } from '../audio-service';
import { MicrophoneService } from '../microphone-service/microphone-service';

@Injectable()
export class SpeakerService implements OnDestroy {
  /**
   * Dependencies
   */
  private readonly _config = inject(ConfigService);
  private readonly _platform = inject(PlatformService);
  private readonly _event = inject(EventService);
  private readonly _mic = inject(MicrophoneService);
  private readonly _orb = inject(OrbComponentService);
  private readonly _audio = inject(AudioService);

  private readonly _subs = new SubSink();

  private _upSound!: HTMLAudioElement;
  private _downSound!: HTMLAudioElement;

  private _nextPlayTime = 0;
  private _sources: AudioBufferSourceNode[] = [];

  constructor() {
    if (this._config.audio.sound?.enable === false) return;

    // Audio is only available in browser context
    if (this._platform.isBrowser) {
      this._upSound = new Audio(
        this._config.audio.sound?.up ?? `${this._config.basePath}/sounds/up.mp3`,
      );
      this._downSound = new Audio(
        this._config.audio.sound?.down ?? `${this._config.basePath}/sounds/down.mp3`,
      );

      this._upSound.preload = this._downSound.preload = 'auto';

      this._loadSubscriptions();
    }
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  /**
   * Play audio chunk
   *
   * @param buffer audio buffer
   * @param sampleRate sample rate to play in
   */
  playChunk(buffer: ArrayBuffer, sampleRate: number) {
    // Calculate how many full 32-bit floats fit in this buffer
    const float32Count = Math.floor(buffer.byteLength / 4);

    // Convert raw bytes back to 32-bit floats
    const float32Array = new Float32Array(buffer, 0, float32Count);

    // Create an empty audio buffer mapping
    const audioBuffer = this._mic.audioContext!.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);

    this.playAudioBuffer(audioBuffer);
  }

  /**
   * Play audio buffer
   *
   * @param audioBuffer
   */
  playAudioBuffer(audioBuffer: AudioBuffer) {
    // if recording, clear the queue
    if (this._audio.isRecording) {
      this._clearQueue();
      return;
    }

    // Create a source node to play the buffer
    const source = this._mic.audioContext!.createBufferSource();
    source.buffer = audioBuffer;

    source.connect(this._mic.analyzer!);
    source.connect(this._mic.audioContext!.destination);

    // Schedule the chunk to play exactly when the previous chunk finishes
    const currentTime = this._mic.audioContext!.currentTime;
    if (this._nextPlayTime < currentTime) {
      this._nextPlayTime = currentTime; // Reset if the queue has emptied
    }

    source.start(this._nextPlayTime);

    this._sources.push(source); // keep instance of source to stop later

    this._nextPlayTime += audioBuffer.duration;

    if (!this._config.orb?.mode || this._config.orb?.mode === 'auto')
      this._orb.setState('speaking'); // speaking
  }

  /**
   * Play on sound
   */
  playUp() {
    if (this._config.audio.sound?.enable === false) return;

    this._upSound.play();
  }

  /**
   * Play off sound
   */
  playDown() {
    if (this._config.audio.sound?.enable === false) return;

    this._downSound.play();
  }

  /**
   * Clear playback queue
   */
  private _clearQueue() {
    this._sources.forEach((s) => s.stop());
    this._sources = [];
    this._nextPlayTime = 0;
  }

  /**
   * Load subscriptions
   */
  private _loadSubscriptions() {
    this._subs.sink = this._event.wakeword
      .pipe(throttleTime(this._config.throttleTime))
      .subscribe(() => {
        this.playUp();
      });

    // If default, on silence, play down
    this._subs.sink = this._event.silence.subscribe((ev) => {
      if (!ev.interimResponse) this.playDown();
    });

    // If recording event
    this._subs.sink = this._event.recording.subscribe(() => {
      this._clearQueue();
    });
  }
}
