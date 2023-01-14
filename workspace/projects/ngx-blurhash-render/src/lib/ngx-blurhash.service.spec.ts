import { TestBed } from '@angular/core/testing';

import { NgxBlurhashService } from './ngx-blurhash.service';

describe('NgxBlurhashService', () => {
  let service: NgxBlurhashService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxBlurhashService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
