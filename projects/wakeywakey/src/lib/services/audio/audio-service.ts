import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  concatMap,
  delay,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  scan,
  share,
  switchMap,
  take,
  takeUntil,
  tap,
  throttleTime,
  timer,
  withLatestFrom,
} from 'rxjs';
import { SubSink } from 'subsink';
import { ConfigService } from '../config/config-service';
import { EventService } from '../event/event-service';
import { SpeechEvent } from '../event/event-service.type';
import { DEFAULT_INFERENCE_SCORE } from '../model/model-service.const';
import { VAD_HANGOVER_FRAMES, VadState } from '../model/model-service.type';
import { PipelineService } from '../pipeline/pipeline-service';
import { DEFAULT_SILENCE_DURATION } from './audio-service.const';
import { MicrophoneService } from './microphone-service/microphone-service';
import { SpeakerService } from './speaker-service/speaker-service';
import { VadService } from './vad-service/vad-service';
import { DEFAULT_VAD_THRESHOLD } from './vad-service/vad-service.const';

@Injectable()
export class AudioService implements OnDestroy {
  /**
   * Dependencies
   */
  private readonly _config = inject(ConfigService);
  private readonly _event = inject(EventService);
  private readonly _mic = inject(MicrophoneService);
  private readonly _vad = inject(VadService);
  private readonly _pipeline = inject(PipelineService);
  private readonly _speaker = inject(SpeakerService);

  private readonly _subs = new SubSink();

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  /**
   * Initialize audio
   */
  async init() {
    const data = await this._mic.data;

    // Init VAD
    this._vad.init();

    // Fire ready event
    this._event.ready.next();

    data.subscribe(async (data) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;

      // Fire a speech event
      this._event.speech.next({
        ...data,
        vadScore: await this._vad.score(data.sample),
        get hasVoiceActivity() {
          return this.vadScore > (that._config.audio.vadThreshold ?? DEFAULT_VAD_THRESHOLD);
        },
      });
    });

    this._listenForWakeword();
    this._captureCommandAfterWakeword();
  }

  /**
   * Identifies the wakeword and emits the event
   */
  private _listenForWakeword() {
    const vad$ = this._getWakeWordStream();

    this._subs.sink = this._event.speech
      .pipe(
        withLatestFrom(vad$),
        concatMap(async ([speech, vadState]) => {
          const score = await this._pipeline.run(speech);
          return { speech, score, chunk: vadState.buffer };
        }),
        filter(
          ({ score }) =>
            score > (this._config.onnx.wakewordInferenceThreshold ?? DEFAULT_INFERENCE_SCORE),
        ),
      )
      .subscribe(({ speech, score, chunk }) => {
        this._speaker.playUp();
        this._event.wakeword.next({ ...speech, inferenceScore: score, chunk });
      });
  }

  /**
   * New logic: Captures the full command audio after a wakeword
   */
  private _captureCommandAfterWakeword() {
    const SILENCE_DURATION = this._config.audio.silenceThreshold ?? DEFAULT_SILENCE_DURATION;
    const VAD_THRESHOLD = this._config.audio.vadThreshold ?? DEFAULT_VAD_THRESHOLD;

    this._subs.sink = this._event.wakeword
      .pipe(
        throttleTime(1000),
        tap(() => {
          this._event.recording.next(); // recording event
        }),

        switchMap(() => {
          const commandChunks: Float32Array[] = [];

          const speech$ = this._event.speech.pipe(
            tap((speech) => commandChunks.push(speech.sample)),
            share(),
          );

          const silence$ = speech$.pipe(
            map((s) => s.vadScore < VAD_THRESHOLD),
            distinctUntilChanged(), // only emit when silence state changes
          );

          return silence$.pipe(
            delay(500),
            switchMap((isSilent) => {
              if (!isSilent) {
                return EMPTY; // if voice cancel the timer
              }

              // silence started, start timer
              return timer(SILENCE_DURATION).pipe(
                takeUntil(
                  silence$.pipe(filter((silent) => !silent)), // cancel if voice resumes
                ),
              );
            }),
            take(1),
            map(() => this._flatten(commandChunks)),
          );
        }),
      )
      .subscribe({
        next: (chunk) => {
          this._speaker.playDown();
          this._event.silence.next(chunk);
        },
        error: (err) => {
          this._event.exception.next(err);
        },
      });
  }

  /**
   * Helper to flatten array of buffers into a single Float32Array
   */
  private _flatten(chunks: Float32Array[]): Float32Array {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  /**
   *
   *
   * @returns
   */
  private _getWakeWordStream() {
    return this._event.speech.pipe(
      scan(
        (state: VadState, speech: SpeechEvent): VadState => {
          const { hasVoiceActivity, sample } = speech;
          let { isActive, hangoverCounter, buffer } = state;

          if (hasVoiceActivity) {
            // If we were idle, start a fresh buffer
            if (!isActive) {
              buffer = [];
              isActive = true;
            }
            // Reset silence tracker to 0 because we hear a voice
            hangoverCounter = 0;
          } else if (isActive) {
            // Increment silence tracker
            hangoverCounter++;

            // If we've reached the limit of allowed silent frames
            if (hangoverCounter >= VAD_HANGOVER_FRAMES) {
              isActive = false;
            }
          }

          // Add sample if we are in an active speech window
          if (isActive) {
            buffer = [...buffer, sample];
          }

          return { buffer, hangoverCounter, isActive };
        },
        { buffer: [], hangoverCounter: -1, isActive: false },
      ),

      // Only share the state when it is actively collecting
      share(),
    );
  }
}
