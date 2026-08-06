import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AnswerControl, SchemaField } from '../../../../core/models/request.models';

@Component({
  selector: 'app-number-field',
  imports: [ReactiveFormsModule],
  templateUrl: './number-field.html',
  styleUrl: './number-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberField {
  readonly field = input.required<SchemaField>();
  readonly control = input.required<AnswerControl>();
  readonly showError = input(false);
  readonly inputId = computed(() => `question-${this.field().id}`);
  readonly errorId = computed(() => `question-${this.field().id}-error`);
  readonly labelId = computed(() => `question-${this.field().id}-label`);
}
