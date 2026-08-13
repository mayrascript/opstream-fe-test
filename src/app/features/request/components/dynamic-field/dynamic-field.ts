import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AnswerControl } from '../../../../core/forms/request-form.types';
import { QuestionSaveState, SchemaField } from '../../../../core/models/request.models';
import { NumberField } from '../../fields/number-field/number-field';
import { RadioField } from '../../fields/radio-field/radio-field';
import { TextField } from '../../fields/text-field/text-field';
import { ToggleField } from '../../fields/toggle-field/toggle-field';
import { FieldShell } from '../field-shell/field-shell';

@Component({
  selector: 'app-dynamic-field',
  imports: [FieldShell, NumberField, RadioField, TextField, ToggleField],
  templateUrl: './dynamic-field.html',
  styleUrl: './dynamic-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicField {
  readonly field = input.required<SchemaField>();
  readonly control = input.required<AnswerControl>();
  readonly attempted = input(false);
  readonly saveState = input<QuestionSaveState>();
  readonly retryRequested = output<number>();
  protected readonly labelFor = computed(() =>
    this.field().type === 'radio' ? null : `question-${this.field().id}`,
  );

  protected shouldShowError(): boolean {
    return this.control().invalid && (this.control().touched || this.attempted());
  }
}
