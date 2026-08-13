import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AnswerControl } from '../../../../core/forms/request-form.types';
import { QuestionSaveState, SchemaField } from '../../../../core/models/request.models';
import { FormError } from '../../../../ui/form-error/form-error';
import { SaveStatusIndicator } from '../../../../ui/save-status-indicator/save-status-indicator';

@Component({
  selector: 'app-field-shell',
  imports: [FormError, SaveStatusIndicator],
  templateUrl: './field-shell.html',
  styleUrl: './field-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldShell {
  readonly field = input.required<SchemaField>();
  readonly control = input.required<AnswerControl>();
  readonly showError = input(false);
  readonly saveState = input<QuestionSaveState>();
  readonly labelFor = input<string | null>(null);
  readonly retryRequested = output<void>();
  readonly errorId = computed(() => `question-${this.field().id}-error`);
  readonly labelId = computed(() => `question-${this.field().id}-label`);
  readonly errorMessage = computed(() => 'This field is required.');
}
