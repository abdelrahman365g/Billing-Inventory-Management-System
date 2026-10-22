import { TestBed } from '@angular/core/testing';
import { ErrorMapper } from './error-mapper';

describe('ErrorMapper', () => {
  let service: ErrorMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorMapper);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
