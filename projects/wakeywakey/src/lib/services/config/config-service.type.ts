import { InjectionToken } from '@angular/core';
import { AudioConfig } from '../audio/audio-service.type';
import { InferenceConfig } from '../inference/inference-service.type';

/**
 * Wakey wakey configuration
 */
export interface Config {
  /**
   * Audio config
   */
  audio: AudioConfig;

  /**
   * Inference config
   */
  inference: InferenceConfig;
}

/**
 * Wakey wakey config token
 */
export const CONFIG = new InjectionToken<Config>('WAKEYWAKEY_CONFIG');
