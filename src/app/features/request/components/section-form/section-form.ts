import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SectionFormGroup } from '../../../../core/forms/request-form.types';
import { QuestionSaveState, SchemaSection } from '../../../../core/models/request.models';
import { Button } from '../../../../ui/button/button';
import { DynamicField } from '../dynamic-field/dynamic-field';

@Component({
  selector: 'app-section-form',
  imports: [Button, DynamicField, ReactiveFormsModule],
  templateUrl: './section-form.html',
  styleUrl: './section-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionForm {
  readonly section = input.required<SchemaSection>();
  readonly group = input.required<SectionFormGroup>();
  readonly attempted = input(false);
  readonly isFirst = input(false);
  readonly isLast = input(false);
  readonly submitting = input(false);
  readonly saveStates = input.required<ReadonlyMap<number, QuestionSaveState>>();
  readonly previousRequested = output<void>();
  readonly nextRequested = output<void>();
  readonly submitRequested = output<void>();
  readonly retryRequested = output<number>();

  protected handleSubmit(): void {
    if (this.isLast()) {
      this.submitRequested.emit();
    } else {
      this.nextRequested.emit();
    }
  }
}
