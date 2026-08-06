import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AnswerControl, SchemaField } from '../../../../core/models/request.models';

@Component({
  selector: 'app-radio-field',
  imports: [ReactiveFormsModule],
  templateUrl: './radio-field.html',
  styleUrl: './radio-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioField {
  readonly field = input.required<SchemaField>();
  readonly control = input.required<AnswerControl>();
  readonly showError = input(false);
  readonly errorId = computed(() => `question-${this.field().id}-error`);
}
