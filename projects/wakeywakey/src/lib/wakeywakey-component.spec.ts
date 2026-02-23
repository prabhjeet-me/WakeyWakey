import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WakeyWakeyComponent } from './wakeywakey-component';

describe('WakeyWakeyComponent', () => {
  let component: WakeyWakeyComponent;
  let fixture: ComponentFixture<WakeyWakeyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WakeyWakeyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WakeyWakeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
