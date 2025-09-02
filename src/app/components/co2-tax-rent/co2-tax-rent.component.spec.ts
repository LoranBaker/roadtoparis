import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Co2TaxRentComponent } from './co2-tax-rent.component';

describe('Co2TaxRentComponent', () => {
  let component: Co2TaxRentComponent;
  let fixture: ComponentFixture<Co2TaxRentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Co2TaxRentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Co2TaxRentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
