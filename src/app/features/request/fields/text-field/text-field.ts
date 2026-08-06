import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AnswerControl, SchemaField } from '../../../../core/models/request.models';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  readonly field = input.required<SchemaField>();
  readonly control = input.required<AnswerControl>();
  readonly showError = input(false);
  readonly inputId = computed(() => `question-${this.field().id}`);
  readonly errorId = computed(() => `question-${this.field().id}-error`);
  readonly labelId = computed(() => `question-${this.field().id}-label`);
}
