import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LocationLookupService } from './location-lookup.service';

describe('LocationLookupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocationLookupService, provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('converts UN/LOCODE coordinate strings to decimal lat/lng', async () => {
    const service = TestBed.inject(LocationLookupService);
    const httpMock = TestBed.inject(HttpTestingController);

    const pending = service.getCoordinates('CNSHA');
    const request = httpMock.expectOne('assets/unlocode-coords.json');
    request.flush({
      CNSHA: { name: 'Shanghai', coordinates: '3114N 12129E' },
    });

    await expect(pending).resolves.toEqual({
      lat: 31.233333333333334,
      lng: 121.48333333333333,
      name: 'Shanghai',
    });
  });

  it('returns null for unknown or invalid coordinate entries', async () => {
    const service = TestBed.inject(LocationLookupService);
    const httpMock = TestBed.inject(HttpTestingController);

    const unknownPending = service.getCoordinates('ZZZZZ');
    const request = httpMock.expectOne('assets/unlocode-coords.json');
    request.flush({
      CNSHA: { name: 'Shanghai', coordinates: '3114N 12129E' },
      BADCD: { name: 'Bad', coordinates: 'not-a-coordinate' },
    });

    await expect(unknownPending).resolves.toBeNull();
    await expect(service.getCoordinates('BADCD')).resolves.toBeNull();
  });

  it('handles west/south hemispheres with negative values', async () => {
    const service = TestBed.inject(LocationLookupService);
    const httpMock = TestBed.inject(HttpTestingController);

    const pending = service.getCoordinates('USLAX');
    const request = httpMock.expectOne('assets/unlocode-coords.json');
    request.flush({
      USLAX: { name: 'Los Angeles', coordinates: '3359N 11816W' },
    });

    await expect(pending).resolves.toEqual({
      lat: 33.983333333333334,
      lng: -118.26666666666667,
      name: 'Los Angeles',
    });
  });
});
