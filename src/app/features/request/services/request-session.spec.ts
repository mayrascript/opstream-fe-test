import { TestBed } from '@angular/core/testing';
import { defer, Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { REQUEST_SCHEMAS } from '../../../core/data/request-schemas';
import { AnswerValue } from '../../../core/models/request.models';
import { MockRequestApi } from '../../../core/services/mock-request-api';
import { RequestSessionService } from './request-session';

class ApiStub {
  readonly saveAnswer = vi.fn<
    (requestId: string, questionId: number, value: AnswerValue) => Observable<void>
  >(() => of(undefined));
}

describe('RequestSessionService', () => {
  let api: ApiStub;
  let service: RequestSessionService;

  beforeEach(() => {
    vi.useFakeTimers();
    api = new ApiStub();
    TestBed.configureTestingModule({
      providers: [{ provide: MockRequestApi, useValue: api }],
    });
    service = TestBed.inject(RequestSessionService);
  });

  afterEach(() => {
    service.reset();
    vi.useRealTimers();
  });

  it('starts and resets a request session', () => {
    const session = service.start(REQUEST_SCHEMAS[1]);

    expect(session.schemaId).toBe('hardware-request');
    expect(session.requestId).toBeTruthy();
    expect(service.form()?.controls['requested-item'].controls['2389182391823812'].value).toBe(
      false,
    );

    service.reset();
    expect(service.session()).toBeNull();
    expect(service.saveStates().size).toBe(0);
  });

  it('debounces a change and marks it as saved', async () => {
    service.start(REQUEST_SCHEMAS[0]);
    const control = service.form()!.controls['requested-item'].controls['1758177604'];
    control.setValue('Security suite');

    expect(service.getQuestionState(1758177604)?.status).toBe('saving');
    expect(api.saveAnswer).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(750);

    expect(api.saveAnswer).toHaveBeenCalledOnce();
    expect(api.saveAnswer).toHaveBeenCalledWith(
      service.session()?.requestId,
      1758177604,
      'Security suite',
    );
    expect(service.getQuestionState(1758177604)?.status).toBe('saved');
  });

  it('cancels an obsolete debounced value', async () => {
    service.start(REQUEST_SCHEMAS[0]);
    const control = service.form()!.controls['requested-item'].controls['1758177604'];
    control.setValue('First');
    await vi.advanceTimersByTimeAsync(500);
    control.setValue('Latest');
    await vi.advanceTimersByTimeAsync(750);

    expect(api.saveAnswer).toHaveBeenCalledOnce();
    expect(api.saveAnswer.mock.calls[0][2]).toBe('Latest');
  });

  it('cancels an in-flight save when a newer debounced value is ready', async () => {
    const subscribers: { succeed: () => void }[] = [];
    let cancellations = 0;
    api.saveAnswer.mockImplementation(
      () =>
        new Observable<void>((subscriber) => {
          subscribers.push({
            succeed: () => {
              subscriber.next();
              subscriber.complete();
            },
          });
          return () => {
            cancellations += 1;
          };
        }),
    );
    service.start(REQUEST_SCHEMAS[0]);
    const control = service.form()!.controls['requested-item'].controls['1758177604'];

    control.setValue('First');
    await vi.advanceTimersByTimeAsync(750);
    expect(api.saveAnswer).toHaveBeenCalledTimes(1);

    control.setValue('Latest');
    await vi.advanceTimersByTimeAsync(750);
    expect(api.saveAnswer).toHaveBeenCalledTimes(2);
    expect(cancellations).toBe(1);

    subscribers[1].succeed();
    expect(service.getQuestionState(1758177604)?.status).toBe('saved');
  });

  it('keeps a newer debounced value pending when an older save completes', async () => {
    const subscribers: { succeed: () => void }[] = [];
    api.saveAnswer.mockImplementation(
      () =>
        new Observable<void>((subscriber) => {
          subscribers.push({
            succeed: () => {
              subscriber.next();
              subscriber.complete();
            },
          });
        }),
    );
    service.start(REQUEST_SCHEMAS[0]);
    const control = service.form()!.controls['requested-item'].controls['1758177604'];

    control.setValue('First');
    await vi.advanceTimersByTimeAsync(750);
    control.setValue('Latest');
    subscribers[0].succeed();

    expect(service.getQuestionState(1758177604)?.status).toBe('saving');
    const waiting = service.waitForSaves();
    let settled = false;
    void waiting.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(750);
    expect(api.saveAnswer).toHaveBeenCalledTimes(2);
    subscribers[1].succeed();
    TestBed.tick();
    await expect(waiting).resolves.toBe(true);
  });

  it('retries twice before reporting a final error', async () => {
    api.saveAnswer.mockImplementation(() => defer(() => throwError(() => new Error('offline'))));
    service.start(REQUEST_SCHEMAS[0]);
    service.form()!.controls['requested-item'].controls['1758177604'].setValue('Suite');

    await vi.advanceTimersByTimeAsync(750);
    expect(service.getQuestionState(1758177604)?.status).toBe('retrying');
    await vi.advanceTimersByTimeAsync(1500);

    expect(api.saveAnswer).toHaveBeenCalledTimes(3);
    expect(service.getQuestionState(1758177604)?.status).toBe('error');
    expect(await service.waitForSaves()).toBe(false);
  });

  it('allows only one manual retry after a final error and creates the final snapshot', async () => {
    api.saveAnswer.mockImplementation(() => throwError(() => new Error('offline')));
    service.start(REQUEST_SCHEMAS[0]);
    const form = service.form()!;
    form.controls['requested-item'].controls['1758177604'].setValue('Suite');
    await vi.advanceTimersByTimeAsync(2250);
    expect(service.getQuestionState(1758177604)?.status).toBe('error');

    api.saveAnswer.mockImplementation(() => of(undefined));
    service.retryQuestion(1758177604);
    service.retryQuestion(1758177604);
    expect(service.getQuestionState(1758177604)?.status).toBe('saved');

    form.controls['requested-item'].controls['75484637462'].setValue(2);
    form.controls['vendor-info'].controls['4957463729'].setValue('Vendor');
    form.controls['vendor-info'].controls['8462736152'].setValue('USA');
    await vi.advanceTimersByTimeAsync(750);

    expect(api.saveAnswer).toHaveBeenCalledTimes(7);
    expect(await service.waitForSaves()).toBe(true);

    const summary = service.captureSummary();
    expect(summary?.answers['75484637462']).toBe(2);
    expect(summary?.schemaId).toBe('software-request');
  });

  it('cancels an active manual retry when the answer changes', async () => {
    api.saveAnswer.mockImplementation(() => throwError(() => new Error('offline')));
    service.start(REQUEST_SCHEMAS[0]);
    const control = service.form()!.controls['requested-item'].controls['1758177604'];
    control.setValue('First');
    await vi.advanceTimersByTimeAsync(2250);
    expect(service.getQuestionState(1758177604)?.status).toBe('error');

    const retrySubscribers: { succeed: () => void }[] = [];
    let manualRetryCancelled = false;
    api.saveAnswer.mockImplementation(
      () =>
        new Observable<void>((subscriber) => {
          retrySubscribers.push({
            succeed: () => {
              subscriber.next();
              subscriber.complete();
            },
          });
          return () => {
            manualRetryCancelled = true;
          };
        }),
    );
    service.retryQuestion(1758177604);
    expect(service.getQuestionState(1758177604)?.status).toBe('saving');

    control.setValue('Latest');

    expect(manualRetryCancelled).toBe(true);
    expect(service.getQuestionState(1758177604)?.status).toBe('saving');
    const waiting = service.waitForSaves();
    await vi.advanceTimersByTimeAsync(750);
    expect(api.saveAnswer.mock.lastCall?.[2]).toBe('Latest');
    retrySubscribers[1].succeed();
    TestBed.tick();
    await expect(waiting).resolves.toBe(true);
  });

  it('ignores retry and summary requests without a session', () => {
    service.retryQuestion(1);
    expect(service.captureSummary()).toBeNull();
  });
});
