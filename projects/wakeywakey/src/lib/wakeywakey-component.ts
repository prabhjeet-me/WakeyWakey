import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { throttleTime } from 'rxjs';
import { SubSink } from 'subsink';
import { OrbComponent } from './components/orb-component/orb-component';
import { AudioService } from './services/audio/audio-service';
import { BridgeService } from './services/bridge/bridge-service';
import { ConfigService } from './services/config/config-service';
import { EventService } from './services/event/event-service';
import {
  RecordingEvent,
  SilenceEvent,
  SpeechEvent,
  WakeWordEvent,
} from './services/event/event-service.type';
import { PlatformService } from './services/platform/platform-service';

const DEFAULT_THROTTLE_TIME = 1000;

@Component({
  selector: 'wakeywakey',
  imports: [OrbComponent],
  template: '<app-orb-component (orbClick)="fireWakeWord()" />',
  providers: [],
})
export class WakeyWakeyComponent implements OnInit, OnDestroy {
  /**
   * Fires when library loaded. Emits bridge service event
   */
  @Output() ready = new EventEmitter<BridgeService>();

  /**
   * Fires when there is an error
   */
  @Output() exception = new EventEmitter<Error>();

  /**
   * Fires when speech is detected
   */
  @Output() speech = new EventEmitter<SpeechEvent>();

  /**
   * Fires when wake word is detected
   */
  @Output() wakeword = new EventEmitter<WakeWordEvent>();

  /**
   * Fires when recording starts (after wake word detection)
   */
  @Output() recording = new EventEmitter<RecordingEvent>();

  /**
   * Fires silence is detected
   */
  @Output() silence = new EventEmitter<SilenceEvent>();

  /**
   * Dependencies
   */
  private readonly _config = inject(ConfigService);

  /**
   * Dependencies
   */
  private readonly _platform = inject(PlatformService);
  private readonly _event = inject(EventService);
  private readonly _audio = inject(AudioService);
  private readonly _bridge = inject(BridgeService);

  /**
   * Subscriptions
   */
  private readonly _subs = new SubSink();

  ngOnInit(): void {
    // Execute pipeline
    this._execute();
  }

  /**
   * Fire face wakeword event
   */
  fireWakeWord() {
    this._event.wakeword.next({
      inferenceScore: 1,
      chunk: [],
      vadScore: 1,
      hasVoiceActivity: false,
      sample: new Float32Array(),
      rms: 0,
      db: 0,
      dbNormalized: 0,
    });
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  /**
   * Execute
   */
  private async _execute() {
    // Check if browser
    if (this._platform.isServer) return;

    // Listen events
    this._listenEvents();

    // Init audio
    await this._audio.init();
  }

  /**
   * Listen events
   */
  private _listenEvents() {
    // Ready event
    this._subs.sink = this._event.ready.subscribe(() => {
      this.ready.emit(this._bridge);
    });

    // Exception event
    this._subs.sink = this._event.exception.subscribe((e) => {
      this.exception.emit(e);
    });

    // Speech event
    this._subs.sink = this._event.speech.subscribe((e) => {
      this.speech.emit(e);
    });

    // Wake word event
    this._subs.sink = this._event.wakeword
      .pipe(throttleTime(this._config.throttleTime ?? DEFAULT_THROTTLE_TIME))
      .subscribe((e) => {
        this.wakeword.emit(e);
      });

    // Recording event
    this._subs.sink = this._event.recording.subscribe((e) => {
      this.recording.emit(e);
    });

    // Silence event
    this._subs.sink = this._event.silence.subscribe((e) => {
      this.silence.emit(e);
    });
  }
}
