import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  concatMap,
  delay,
  distinctUntilChanged,
  EMPTY,
  filter,
  ignoreElements,
  map,
  merge,
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
import { SpeechRecognitionService } from './speech-recognition/speech-recognition-service';
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
  private readonly _speechRecognition = inject(SpeechRecognitionService);

  private readonly _subs = new SubSink();

  private _endCurrentRecording = false;

  /**
   * Recording state
   */
  private _isRecording = false;

  /**
   * Is process is initialized (detected wakeword)
   */
  private _isInitialized = false;

  get isRecording() {
    return this._isRecording;
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  /**
   * Initialize audio
   */
  async init() {
    if (!this._mic.microphones.length) {
      this._event.exception.next(new Error('Microphone permission required!'));
      return;
    }

    const data = await this._mic.data;

    // Init VAD
    this._vad.init();

    this._speechRecognition.init();

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
   * Force start recording (without wakeword)
   */
  forceStartRecording() {
    this._isInitialized = true;
    this._endCurrentRecording = false;

    // this._speechRecognition.reset(); // reset transcript
    this._event.wakeword.next({
      inferenceScore: 0,
      chunk: [],
      vadScore: 0,
      hasVoiceActivity: false,
      sample: new Float32Array(),
      rms: 0,
      db: 0,
      dbNormalized: 0,
    });
  }

  /**
   * Force end recording
   */
  forceEndRecording() {
    this._endCurrentRecording = true;

    this._event.silence.next({
      chunk: new Float32Array(),
      transcript: '',
      interimResponse: false, // final response
    });
  }

  /**
   * Toggle recording
   */
  toggleRecording() {
    if (this._isInitialized) {
      this._isInitialized = false;
      this.forceEndRecording();
    } else this.forceStartRecording();
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
        this._event.wakeword.next({ ...speech, inferenceScore: score, chunk });
      });
  }

  /**
   * New logic: Captures the full command audio after a wakeword
   */
  private _captureCommandAfterWakeword() {
    const SILENCE_DURATION = this._config.audio.silenceDuration ?? DEFAULT_SILENCE_DURATION;
    const VAD_THRESHOLD = this._config.audio.vadThreshold ?? DEFAULT_VAD_THRESHOLD;

    // --- TRIGGER 1: Wakeword ---
    const wakewordTrigger$ = this._event.wakeword.pipe(
      filter(() => !this._isRecording), // Ignore wakeword if already recording
      map(() => [] as Float32Array[]),
    );

    // --- TRIGGER 2: Continuous VAD > THRESHOLD for 1 second ---
    const continuousVadTrigger$ = this._event.speech.pipe(
      map((s) => s.vadScore > VAD_THRESHOLD),
      filter(() => !this._isRecording && this._isInitialized), // Ignore and prevent background buffering if already recording
      distinctUntilChanged(),
      switchMap((isVoiceActive) => {
        if (!isVoiceActive) return EMPTY; // Cancel if voice stops

        this._speechRecognition.reset();

        const bufferedChunks: Float32Array[] = [];

        // 1. Accumulate audio chunks silently
        const buffer$ = this._event.speech.pipe(
          tap((s) => bufferedChunks.push(s.sample)),
          ignoreElements(), // Prevents this stream from emitting down the pipe
        );

        // 2. Timer that emits the accumulated chunks after 1 second
        const timer$ = timer(300).pipe(map(() => bufferedChunks));

        // Merge both. If the timer fires, take(1) stops the buffer$ stream.
        // If isVoiceActive turns false before 1s, switchMap cancels both.
        return merge(buffer$, timer$).pipe(take(1));
      }),
    );

    // --- COMBINE TRIGGERS ---
    const startRecordingTrigger$ = merge(
      wakewordTrigger$.pipe(
        tap(() => {
          if (!this._isInitialized) this._isInitialized = true; // initialized
        }),
      ),
      continuousVadTrigger$,
    ).pipe(
      throttleTime(1000), // Prevent double-firing if wakeword and voice overlap
    );

    // --- MAIN RECORDING PIPELINE ---
    this._subs.sink = startRecordingTrigger$
      .pipe(
        tap(() => {
          this._isRecording = true;
          this._speechRecognition.reset();
          this._event.recording.next(); // recording event
        }),

        switchMap((bufferedChunks) => {
          // Initialize our command chunks with anything captured during the 1s VAD wait
          const commandChunks: Float32Array[] = [...bufferedChunks];

          const speech$ = this._event.speech.pipe(
            tap((speech) => commandChunks.push(speech.sample)),
            share(),
          );

          const silence$ = speech$.pipe(
            map((s) => s.vadScore < VAD_THRESHOLD),
            distinctUntilChanged(), // only emit when silence state changes
          );

          // 1. Normal silence timeout logic
          const normalSilenceTimeout$ = silence$.pipe(
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
          );

          // 2. Force complete logic checking the variable
          const forceComplete$ = speech$.pipe(filter(() => this._endCurrentRecording));

          // 3. Complete whenever the timer fires OR the flag is set to true
          return merge(normalSilenceTimeout$, forceComplete$).pipe(
            take(1),
            map(() => this._flatten(commandChunks)),
          );
        }),
      )
      .subscribe({
        next: (chunk) => {
          const interimResponse = this._config.mode === 'DEFAULT' ? false : true;

          this._event.silence.next({
            chunk,
            transcript: this._speechRecognition.transcript,
            interimResponse,
          }); // emit silence event

          // Default case
          if (this._config.mode === 'DEFAULT') {
            this._isInitialized = false;
            this._endCurrentRecording = false; // reset flag after recording ends
          }

          this._isRecording = false;
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
   * Wakeword stream
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
