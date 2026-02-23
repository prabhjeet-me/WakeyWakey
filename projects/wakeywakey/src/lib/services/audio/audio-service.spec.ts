import { TestBed } from '@angular/core/testing';

import { AudioService } from './audio-service';

describe('AudioService', () => {
  let service: AudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Audio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
