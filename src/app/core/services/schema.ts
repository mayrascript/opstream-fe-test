import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestSchema } from '../models/request.models';
import { validateSchemas } from '../validation/schema.validator';
import { MockRequestApi } from './mock-request-api';

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private readonly api = inject(MockRequestApi);
  private schemas: RequestSchema[] = [];

  getSchemas(): Observable<RequestSchema[]> {
    return this.api.getSchemas().pipe(
      map((schemas) => validateSchemas(schemas)),
      map((schemas) => {
        this.schemas = schemas;
        return schemas;
      }),
    );
  }

  getCachedSchema(schemaId: string): RequestSchema | undefined {
    return this.schemas.find((schema) => schema.id === schemaId);
  }
}
