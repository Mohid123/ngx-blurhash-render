import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxBlurhashComponent } from './ngx-blurhash.component';

describe('NgxBlurhashComponent', () => {
  let component: NgxBlurhashComponent;
  let fixture: ComponentFixture<NgxBlurhashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgxBlurhashComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxBlurhashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
