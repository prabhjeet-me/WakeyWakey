import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable()
export class PlatformService {
  private readonly _platform = inject(PLATFORM_ID);

  /**
   * Is browser
   */
  get isBrowser(): boolean {
    return isPlatformBrowser(this._platform);
  }

  /**
   * Is server
   */
  get isServer(): boolean {
    return isPlatformServer(this._platform);
  }
}
