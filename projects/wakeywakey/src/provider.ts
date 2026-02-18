import { Provider } from '@angular/core';
import { CONFIG, Config } from './lib/services/config/config-service.type';

/**
 * Provide wakey wakey configuration
 *
 * @param config Wakey Wakey configuration
 * @returns
 */
export function provideWakeyWakey(config: Config): Provider[] {
  return [
    {
      provide: CONFIG,
      useValue: config,
    },
  ];
}
