import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrandedAssetsComponent } from './stranded-assets.component';

describe('StrandedAssetsComponent', () => {
  let component: StrandedAssetsComponent;
  let fixture: ComponentFixture<StrandedAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrandedAssetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StrandedAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
