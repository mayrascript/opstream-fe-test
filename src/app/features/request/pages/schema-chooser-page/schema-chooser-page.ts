import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { RequestSchema } from '../../../../core/models/request.models';
import { SchemaService } from '../../../../core/services/schema';
import { RequestSessionService } from '../../services/request-session';

@Component({
  selector: 'app-schema-chooser-page',
  imports: [],
  templateUrl: './schema-chooser-page.html',
  styleUrl: './schema-chooser-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaChooserPage {
  private readonly schemasService = inject(SchemaService);
  private readonly session = inject(RequestSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly schemas = signal<RequestSchema[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.session.reset();
    this.loadSchemas();
  }

  protected choose(schema: RequestSchema): void {
    this.session.start(schema);
    void this.router.navigate(['/request', schema.id, schema.sections[0].id]);
  }

  protected loadSchemas(): void {
    this.loading.set(true);
    this.error.set('');
    this.schemasService
      .getSchemas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schemas) => {
          this.schemas.set(schemas);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('We could not load the request types. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
