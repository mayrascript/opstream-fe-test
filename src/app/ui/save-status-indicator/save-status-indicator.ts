import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QuestionSaveState } from '../../core/models/request.models';

@Component({
  selector: 'app-save-status-indicator',
  imports: [],
  templateUrl: './save-status-indicator.html',
  styleUrl: './save-status-indicator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveStatusIndicator {
  readonly state = input<QuestionSaveState>();
  readonly retryRequested = output<void>();
}
