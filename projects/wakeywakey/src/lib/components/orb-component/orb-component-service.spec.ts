import { TestBed } from '@angular/core/testing';

import { OrbComponentService } from './orb-component-service';

describe('OrbComponentService', () => {
  let service: OrbComponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrbComponentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
