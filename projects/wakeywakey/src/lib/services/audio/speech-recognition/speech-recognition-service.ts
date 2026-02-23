import { inject, Injectable, OnDestroy } from '@angular/core';
import { EventService } from '../../event/event-service';

@Injectable()
export class SpeechRecognitionService implements OnDestroy {
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
   * Get transcript
   */
  get transcript() {
    return this._transcript;
  }

  ngOnDestroy(): void {
    this.reset(); // clear transcript
    this._recognition.stop();
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

      for (let i = event.resultIndex; i < event.results.length; i++)
        this._transcript += event.results[i][0].transcript;
    };

    this._recognition.start(); // start
  }
}
