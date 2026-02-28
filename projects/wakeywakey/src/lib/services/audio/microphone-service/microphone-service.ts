import { inject, Injectable, OnDestroy } from '@angular/core';
import { loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import { Subject } from 'rxjs';
import { ConfigService } from '../../config/config-service';
import { EventService } from '../../event/event-service';
import {
  MICROPHONE_PROCESSOR,
  MICROPHONE_PROCESSOR_NAME,
  SAMPLE_RATE,
} from './microphone-service.constant';
import { MicrophoneProcessorData } from './microphone-service.type';

@Injectable()
export class MicrophoneService implements OnDestroy {
  /**
   * Dependencies
   */
  private readonly _event = inject(EventService);
  private readonly _config = inject(ConfigService);

  /**
   * Audio data subject
   */
  private readonly _data = new Subject<MicrophoneProcessorData>();

  /**
   * List of available microphones
   */
  private _microphones: MediaDeviceInfo[] = [];

  /**
   * Media steam
   */
  private _stream!: MediaStream;

  /**
   * Media steam source
   */
  private _source?: MediaStreamAudioSourceNode;

  /**
   * Audio context
   */
  private _audioContext?: AudioContext;

  /**
   * Is muted
   */
  private _isMuted = false;

  /**
   * Gain node
   */
  private _gainNode?: GainNode | undefined;

  private _analyser?: AnalyserNode;

  /**
   * List of available microphones
   */
  get microphones() {
    return this._microphones;
  }

  /**
   * Microphone data
   */
  get data() {
    return this._data;
  }

  /**
   * Audio context
   */
  get audioContext() {
    return this._audioContext;
  }

  /**
   * Analyzer node
   */
  get analyzer() {
    return this._analyser;
  }

  /**
   * Media steam source node
   */
  get sourceNode() {
    return this._source;
  }

  /**
   * Muted state
   */
  get isMuted() {
    return this._isMuted;
  }

  /**
   * Set gain
   */
  set gain(value: number) {
    if (this._gainNode) this._gainNode.gain.value = value;
  }

  /**
   * Set muted state
   */
  set isMuted(set: boolean) {
    this._isMuted = set;
  }

  /**
   * Set input source
   */
  set source(deviceId: string) {
    this.init(deviceId);
  }

  ngOnDestroy(): void {
    // close audio context
    this._audioContext?.close();
    this._source?.disconnect();
    this._analyser?.disconnect();
    this._stream?.getTracks().forEach((track) => {
      track.stop();
    });
  }

  /**
   * Initialize
   *
   * @param deviceId Input device id (from microphone list)
   */
  async init(deviceId = 'default') {
    try {
      // cleanup
      this.ngOnDestroy();

      // request permission
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          noiseSuppression: this._config.audio.noiseSuppression?.nativeNoiseSuppression || false,
          echoCancellation: this._config.audio.noiseSuppression?.nativeEchoCancellation || false,
          autoGainControl: this._config.audio.noiseSuppression?.autoGainControl || false,
        },
      });

      this._event.log.next(
        `${MicrophoneService.name}: Microphone permission granted (deviceid: '${deviceId ?? 'default'}')!`,
      );

      // save list of microphones
      this._microphones = await this._microphoneList();

      // monitor audio
      await this._monitor();

      return true;
    } catch (error) {
      this._event.exception.next(error as Error);
    }

    return false;
  }

  /**
   * Monitor audio
   *
   * @returns chunk subject
   */
  private async _monitor() {
    const worklet = await this._workletNode();

    // on message
    worklet.port.onmessage = async (event) => {
      const data = (event.data as MicrophoneProcessorData) ?? null;
      if (!data) return;

      // emit chunk
      this._data.next(data);
    };

    return this._data;
  }

  /**
   * Save microphones
   */
  private async _microphoneList() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'audioinput');
  }

  /**
   * Prepare worklet node
   */
  private async _workletNode() {
    // Create audio context
    this._audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

    this._analyser = this._audioContext.createAnalyser();
    this._analyser.fftSize = 256;

    if (this._config.audio.noiseSuppression) {
      await this._audioContext.audioWorklet.addModule(
        this._config.audio.noiseSuppression.worklet ??
          `${this._config.basePath}/worklets/workletProcessor.js`,
      );
    }

    // Load custom worklet
    const blob = new Blob([MICROPHONE_PROCESSOR], { type: 'application/javascript' });
    const workletURL = URL.createObjectURL(blob);
    await this._audioContext.audioWorklet.addModule(workletURL);
    URL.revokeObjectURL(workletURL);

    // Create Nodes
    this._source = this._audioContext.createMediaStreamSource(this._stream);

    // Gain Node
    const gainNode = this._audioContext.createGain();
    gainNode.gain.value = this._config.audio.gain;

    if (this._config.audio.noiseSuppression) {
      // Load RNNoise dependencies
      const rnnoiseWasmBinary = await loadRnnoise({
        url:
          this._config.audio.noiseSuppression.rnnoise ??
          `${this._config.basePath}/wasm/rnnoise.wasm`,
        simdUrl:
          this._config.audio.noiseSuppression.rnnoise_simd ??
          `${this._config.basePath}/wasm/rnnoise_simd.wasm`,
      });

      // RNNoise Node
      const rnnoiseNode = new RnnoiseWorkletNode(this._audioContext, {
        wasmBinary: rnnoiseWasmBinary,
        maxChannels: 1, // Standard for mono microphone input
      });

      this._source.connect(rnnoiseNode);
      rnnoiseNode.connect(gainNode);
    } else {
      this._source.connect(gainNode);
    }

    this._source.connect(this._analyser);

    // loop back mic sound
    if (this._config.audio.loopBackToSpeakers)
      this._analyser.connect(this.audioContext!.destination);

    // Custom Worklet Node
    const workletNode = new AudioWorkletNode(this._audioContext, MICROPHONE_PROCESSOR_NAME);

    // Connect the Graph: Source -> RNNoise (if noise suppression) -> Gain -> Custom Worklet
    gainNode.connect(workletNode);

    return workletNode;
  }
}
