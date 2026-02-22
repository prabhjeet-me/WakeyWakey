import { inject, Injectable, OnDestroy } from '@angular/core';
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
   * Audio context
   */
  private _audioContext?: AudioContext;

  constructor() {
    // Init mic
    this._init();
  }

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
   * Set input source
   */
  set source(deviceId: string) {
    this._init(deviceId);
  }

  ngOnDestroy(): void {
    // close audio context
    this._audioContext?.close();
  }

  /**
   * Initialize
   *
   * @param deviceId Input device id (from microphone list)
   */
  private async _init(deviceId?: string) {
    try {
      // cleanup
      this.ngOnDestroy();

      // request permission
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: !deviceId
          ? {
              noiseSuppression: true,
              echoCancellation: true,
            }
          : { deviceId: { exact: deviceId } },
      });

      this._event.log.next(
        `${MicrophoneService.name}: Microphone permission granted (deviceid: '${deviceId ?? 'default'}')!`,
      );

      // save list of microphones
      this._microphones = await this._microphoneList();

      // monitor audio
      this._monitor();

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
   *
   * @param stream Media stream
   */
  private async _workletNode() {
    // Create audio context
    this._audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const source = this._audioContext.createMediaStreamSource(this._stream);

    // worklet
    const blob = new Blob([MICROPHONE_PROCESSOR], { type: 'application/javascript' });
    const workletURL = URL.createObjectURL(blob);
    await this._audioContext.audioWorklet.addModule(workletURL);
    URL.revokeObjectURL(workletURL);

    const workletNode = new AudioWorkletNode(this._audioContext, MICROPHONE_PROCESSOR_NAME);

    // Add gain
    const gainNode = this._audioContext.createGain();
    gainNode.gain.value = this._config.audio.gain;

    // connect
    source.connect(gainNode);
    gainNode.connect(workletNode);

    return workletNode;
  }
}
