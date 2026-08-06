import { Injectable } from '@angular/core';
import { map, Observable, timer } from 'rxjs';
import { REQUEST_SCHEMAS } from '../data/request-schemas';
import { RequestSchema } from '../models/request.models';

@Injectable({ providedIn: 'root' })
export class MockRequestApi {
  getSchemas(): Observable<RequestSchema[]> {
    return timer(250).pipe(map(() => structuredClone(REQUEST_SCHEMAS)));
  }
}
