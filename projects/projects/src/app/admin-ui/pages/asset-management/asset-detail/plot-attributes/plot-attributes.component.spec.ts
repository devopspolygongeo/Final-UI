import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlotAttributesComponent } from './plot-attributes.component';

describe('PlotAttributesComponent', () => {
  let component: PlotAttributesComponent;
  let fixture: ComponentFixture<PlotAttributesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlotAttributesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlotAttributesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
