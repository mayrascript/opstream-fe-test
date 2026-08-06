import { inject, Injectable, InjectionToken } from '@angular/core';
import { defer, map, mergeMap, Observable, of, throwError, timer } from 'rxjs';
import { REQUEST_SCHEMAS } from '../data/request-schemas';
import { AnswerValue, RequestSchema } from '../models/request.models';

export interface RequestApiSimulation {
  schemaLatencyMs: number;
  saveLatencyMinMs: number;
  saveLatencyMaxMs: number;
  failureRate: number;
  random: () => number;
}

export const REQUEST_API_SIMULATION = new InjectionToken<RequestApiSimulation>(
  'request-api-simulation',
  {
    providedIn: 'root',
    factory: () => ({
      schemaLatencyMs: 250,
      saveLatencyMinMs: 600,
      saveLatencyMaxMs: 1000,
      failureRate: 0.15,
      random: Math.random,
    }),
  },
);

@Injectable({ providedIn: 'root' })
export class MockRequestApi {
  private readonly simulation = inject(REQUEST_API_SIMULATION);
  private readonly savedAnswers = new Map<string, AnswerValue>();

  getSchemas(): Observable<RequestSchema[]> {
    return timer(this.simulation.schemaLatencyMs).pipe(map(() => structuredClone(REQUEST_SCHEMAS)));
  }

  saveAnswer(requestId: string, questionId: number, value: AnswerValue): Observable<void> {
    return defer(() => {
      const range = this.simulation.saveLatencyMaxMs - this.simulation.saveLatencyMinMs;
      const latency =
        this.simulation.saveLatencyMinMs + Math.round(this.simulation.random() * range);

      return timer(latency).pipe(
        mergeMap(() => {
          if (this.simulation.random() < this.simulation.failureRate) {
            return throwError(() => new Error('The answer could not be saved.'));
          }

          this.savedAnswers.set(`${requestId}:${questionId}`, value);
          return of(undefined);
        }),
      );
    });
  }
}
