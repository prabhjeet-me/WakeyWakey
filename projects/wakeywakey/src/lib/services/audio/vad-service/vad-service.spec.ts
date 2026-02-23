import { TestBed } from '@angular/core/testing';

import { VadService } from './vad-service';

describe('VadService', () => {
  let service: VadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
