import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-error',
  imports: [],
  templateUrl: './form-error.html',
  styleUrl: './form-error.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormError {
  readonly errorId = input.required<string>();
  readonly message = input('This field is required.');
}
