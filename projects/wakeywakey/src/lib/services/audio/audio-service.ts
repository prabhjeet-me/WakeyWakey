import { Injectable, OnDestroy, inject } from '@angular/core';
import { concatMap, filter, scan, share, withLatestFrom } from 'rxjs';
import { SubSink } from 'subsink';
import { ConfigService } from '../config/config-service';
import { EventService } from '../event/event-service';
import { SpeechEvent } from '../event/event-service.type';
import { DEFAULT_INFERENCE_SCORE } from '../model/model-service.const';
import { VAD_HANGOVER_FRAMES, VadState } from '../model/model-service.type';
import { PipelineService } from '../pipeline/pipeline-service';
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

    // Infer speech
    this._inferSpeech();
  }

  /**
   * Infer speech
   */
  private _inferSpeech() {
    const vad$ = this._getWakeWordStream();

    this._subs.sink = this._event.speech
      .pipe(
        // 1. Combine the raw speech with the current buffer state
        withLatestFrom(vad$),

        // 2. Run your async ML pipeline
        concatMap(async ([speech, vadState]) => {
          const score = await this._pipeline.run(speech);
          return { speech, score, chunk: vadState.buffer };
        }),

        // 3. Filter for detections
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
