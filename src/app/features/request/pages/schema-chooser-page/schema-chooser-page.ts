import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
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
  private readonly injector = inject(Injector);
  private readonly schemaChips = viewChildren<ElementRef<HTMLButtonElement>>('schemaChip');
  private readonly chooserHeading = viewChild<ElementRef<HTMLHeadingElement>>('chooserHeading');

  protected readonly schemas = signal<RequestSchema[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly selectedSchemaId = signal<string | null>(null);
  protected readonly selectionError = signal('');
  protected readonly selectedSchema = computed(() =>
    this.schemas().find((schema) => schema.id === this.selectedSchemaId()),
  );

  constructor() {
    this.session.reset();
    this.loadSchemas();
  }

  protected selectSchema(schema: RequestSchema): void {
    this.selectedSchemaId.set(schema.id);
    this.selectionError.set('');
  }

  protected start(): void {
    const schema = this.selectedSchema();
    if (!schema) {
      this.selectionError.set('Choose what you need to purchase before starting.');
      this.schemaChips()[0]?.nativeElement.focus();
      return;
    }

    this.session.start(schema);
    void this.router.navigate(['/request', schema.id, schema.sections[0].id]);
  }

  protected schemaLabel(schema: RequestSchema): string {
    return schema.title.replace(/ request$/i, '');
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
          afterNextRender(() => this.chooserHeading()?.nativeElement.focus(), {
            injector: this.injector,
          });
        },
        error: () => {
          this.error.set('We could not load the request types. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
