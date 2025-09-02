import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergyPerformanceComponent } from './energy-performance.component';

describe('EnergyPerformanceComponent', () => {
  let component: EnergyPerformanceComponent;
  let fixture: ComponentFixture<EnergyPerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergyPerformanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnergyPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
