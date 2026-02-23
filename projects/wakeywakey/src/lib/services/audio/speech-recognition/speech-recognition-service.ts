import { inject, Injectable } from '@angular/core';
import { EventService } from '../../event/event-service';

@Injectable()
export class SpeechRecognitionService {
  /**
   * Dependencies
   */
  private readonly _event = inject(EventService);

  private _recognitionClass!: {
    new (): SpeechRecognition;
    prototype: SpeechRecognition;
  };

  /**
   * Instance
   */
  private _recognition!: SpeechRecognition;

  /**
   * Transcript
   */
  private _transcript = '';

  /**
   * Flag for recording
   */
  private _isRecognizing = false;

  /**
   * Get transcript
   */
  get transcript() {
    return this._transcript;
  }

  /**
   * Get if recording
   */
  get isRecognizing() {
    return this._isRecognizing;
  }

  /**
   * Start recognition
   */
  start() {
    if (this._isRecognizing) return;

    this._recognition.start();
    this._isRecognizing = true;
  }

  /**
   * Stop recognition
   */
  stop() {
    if (!this._isRecognizing) return;

    this.reset(); // clear transcript

    this._recognition.stop();
    this._isRecognizing = false;
  }

  /**
   * Clear transcript
   */
  reset() {
    this._transcript = '';
  }

  init() {
    this._recognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this._event.exception.next(new Error('Speech recognition is not supported'));
      return;
    }

    this._recognition = new this._recognitionClass(); // initialize

    // 2. Configuration
    this._recognition.lang = 'en-US'; // Set language
    this._recognition.continuous = true; // Keep listening even if the user pauses
    this._recognition.interimResults = true; // Show results while the user is still speaking

    // 3. Handle Results
    this._recognition.onresult = (event) => {
      this._transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        this._transcript += event.results[i][0].transcript;
      }
    };
  }
}
