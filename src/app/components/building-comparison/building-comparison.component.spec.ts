import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingComparisonComponent } from './building-comparison.component';

describe('BuildingComparisonComponent', () => {
  let component: BuildingComparisonComponent;
  let fixture: ComponentFixture<BuildingComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingComparisonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildingComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
