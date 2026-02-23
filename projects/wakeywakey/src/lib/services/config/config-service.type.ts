import { InjectionToken } from '@angular/core';
import { OrbConfig } from '../../components/orb-component/orb-component.type';
import { AudioConfig } from '../audio/audio-service.type';
import { OnnxConfig } from '../model/model-service.type';

/**
 * Wakey wakey configuration
 */
export interface Config {
  /**
   * Audio config
   */
  audio: AudioConfig;

  /**
   * Onnx config
   */
  onnx: OnnxConfig;

  /**
   * Orb config
   */
  orb?: OrbConfig;

  /**
   * In sliding window, there is a possibility of detecting wakeword mode than once.
   * This allows a cool down time before processing subsequent detections
   *
   * Default: 1000 (1 seconds)
   */
  throttleTime?: number;

  /**
   * DEFAULT: [WAKEWORD] -> Start Recording -> Silence (Spoken chunk & transcript) -> Done -> [WAKEWORD] .....
   * CHAT: [WAKEWORD] -> Start Recording -> Silence -> [Speaking] ->  Start Recording -> Silence .....
   */
  mode?: 'DEFAULT' | 'VOICE_CHAT';

  /**
   * Base asset path. This path will be used to access required resources
   *
   * Default: /wakeywakey
   */
  basePath?: string;
}

/**
 * Wakey wakey config token
 */
export const CONFIG = new InjectionToken<Config>('WAKEYWAKEY_CONFIG');
