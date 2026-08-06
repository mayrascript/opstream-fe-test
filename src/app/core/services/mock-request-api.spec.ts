import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { MockRequestApi, REQUEST_API_SIMULATION } from './mock-request-api';

describe('MockRequestApi', () => {
  afterEach(() => vi.useRealTimers());

  it('returns the request schemas after the configured latency', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: REQUEST_API_SIMULATION,
          useValue: {
            schemaLatencyMs: 20,
            saveLatencyMinMs: 0,
            saveLatencyMaxMs: 0,
            failureRate: 0,
            random: () => 1,
          },
        },
      ],
    });
    const promise = firstValueFrom(TestBed.inject(MockRequestApi).getSchemas());
    await vi.advanceTimersByTimeAsync(20);

    expect((await promise).map(({ id }) => id)).toEqual(['software-request', 'hardware-request']);
  });

  it('simulates save success and failure deterministically', async () => {
    vi.useFakeTimers();
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: REQUEST_API_SIMULATION,
          useValue: {
            schemaLatencyMs: 0,
            saveLatencyMinMs: 0,
            saveLatencyMaxMs: 0,
            failureRate: 0.5,
            random,
          },
        },
      ],
    });
    const assertion = expect(
      firstValueFrom(TestBed.inject(MockRequestApi).saveAnswer('request', 1, 'value')),
    ).rejects.toThrow('could not be saved');
    await vi.runAllTimersAsync();

    await assertion;
  });
});
