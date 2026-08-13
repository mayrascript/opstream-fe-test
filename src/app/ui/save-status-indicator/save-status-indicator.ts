import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SaveIndicatorState {
  status: 'idle' | 'saving' | 'retrying' | 'saved' | 'error';
  lastSavedAt?: Date;
  error?: string;
}

@Component({
  selector: 'app-save-status-indicator',
  imports: [],
  templateUrl: './save-status-indicator.html',
  styleUrl: './save-status-indicator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveStatusIndicator {
  readonly state = input<SaveIndicatorState>();
  readonly retryRequested = output<void>();
}
