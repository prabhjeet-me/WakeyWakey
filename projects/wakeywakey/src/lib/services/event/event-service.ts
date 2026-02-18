import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SpeechEvent, WakeWordEvent } from './event-service.type';

@Injectable()
export class EventService {
  /**
   * Fires when library loaded
   */
  readonly ready = new Subject<void>();

  /**
   * Fires when there is a message to log
   */
  readonly log = new Subject<string>();

  /**
   * Fires when there is an error
   */
  readonly exception = new Subject<Error>();

  /**
   * Fires when speech is detected
   */
  readonly speech = new Subject<SpeechEvent>();

  /**
   * Fires when wake word is detected
   */
  readonly wakeword = new Subject<WakeWordEvent>();

  /**
   * Fires when recording starts (after wake word detection)
   */
  readonly recording = new Subject<void>();

  /**
   * Fires silence is detected
   */
  readonly silence = new Subject<SpeechEvent>();
}
