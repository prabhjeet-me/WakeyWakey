import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Wakeywakey } from './wakeywakey';

describe('Wakeywakey', () => {
  let component: Wakeywakey;
  let fixture: ComponentFixture<Wakeywakey>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wakeywakey]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Wakeywakey);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
