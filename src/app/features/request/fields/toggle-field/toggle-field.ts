import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AnswerControl } from '../../../../core/forms/request-form.types';
import { SchemaField } from '../../../../core/models/request.models';

@Component({
  selector: 'app-toggle-field',
  imports: [ReactiveFormsModule],
  templateUrl: './toggle-field.html',
  styleUrl: './toggle-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleField {
  readonly field = input.required<SchemaField>();
  readonly control = input.required<AnswerControl>();
  readonly showError = input(false);
  readonly inputId = computed(() => `question-${this.field().id}`);
  readonly errorId = computed(() => `question-${this.field().id}-error`);
  readonly labelId = computed(() => `question-${this.field().id}-label`);
}
