import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

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
  private readonly injector = inject(Injector);
  private readonly statusContainer = viewChild<ElementRef<HTMLElement>>('statusContainer');
  private readonly retryButton = viewChild<ElementRef<HTMLButtonElement>>('retryButton');
  private retryHasStarted = false;

  readonly state = input<SaveIndicatorState>();
  readonly fieldLabel = input.required<string>();
  readonly retryRequested = output<void>();
  protected readonly retryPending = signal(false);
  protected readonly announcement = computed(() => {
    const save = this.state();
    if (!save || save.status === 'idle') {
      return '';
    }

    const label = this.fieldLabel();
    switch (save.status) {
      case 'saving':
        return this.retryPending() ? `${label}: retrying.` : `${label}: saving.`;
      case 'retrying':
        return `${label}: save failed. Retrying.`;
      case 'saved':
        return `${label}: saved.`;
      case 'error':
        return `${label}: not saved. Retry is required.`;
    }
  });

  constructor() {
    effect(() => {
      const status = this.state()?.status;
      if (!this.retryPending()) {
        return;
      }

      if (status === 'saving' || status === 'retrying') {
        this.retryHasStarted = true;
        return;
      }

      if (!this.retryHasStarted) {
        return;
      }

      if (status === 'saved') {
        afterNextRender(
          () => {
            const retryButton = this.retryButton()?.nativeElement;
            if (retryButton && document.activeElement === retryButton) {
              this.statusContainer()?.nativeElement.focus();
            }
            this.retryPending.set(false);
            this.retryHasStarted = false;
          },
          { injector: this.injector },
        );
      } else if (status === 'error') {
        this.retryPending.set(false);
        this.retryHasStarted = false;
      }
    });
  }

  protected retry(): void {
    if (this.retryPending()) {
      return;
    }
    this.retryHasStarted = false;
    this.retryPending.set(true);
    this.retryRequested.emit();
  }
}
