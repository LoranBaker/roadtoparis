import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inline3dModelComponent } from './inline3d-model.component';

describe('Inline3dModelComponent', () => {
  let component: Inline3dModelComponent;
  let fixture: ComponentFixture<Inline3dModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inline3dModelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inline3dModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
