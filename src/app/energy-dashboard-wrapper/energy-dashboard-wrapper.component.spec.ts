import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergyDashboardWrapperComponent } from './energy-dashboard-wrapper.component';

describe('EnergyDashboardWrapperComponent', () => {
  let component: EnergyDashboardWrapperComponent;
  let fixture: ComponentFixture<EnergyDashboardWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergyDashboardWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnergyDashboardWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
