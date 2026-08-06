import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'quiet'>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
}
