import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnswerValue } from '../../../../core/models/request.models';
import { Button } from '../../../../ui/button/button';
import { RequestSessionService } from '../../services/request-session';

@Component({
  selector: 'app-request-summary-page',
  imports: [Button],
  templateUrl: './request-summary-page.html',
  styleUrl: './request-summary-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestSummaryPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly summaryHeading = viewChild<ElementRef<HTMLHeadingElement>>('summaryHeading');
  protected readonly requestSession = inject(RequestSessionService);

  constructor() {
    const requestedId = this.route.snapshot.paramMap.get('requestId');
    if (
      !this.requestSession.summary() ||
      this.requestSession.summary()?.requestId !== requestedId ||
      !this.requestSession.schema()
    ) {
      void this.router.navigateByUrl('/', { replaceUrl: true });
      return;
    }

    afterNextRender(() => this.summaryHeading()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected displayValue(value: AnswerValue): string {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === '') {
      return 'Not provided';
    }
    return String(value);
  }

  protected isEmpty(value: AnswerValue): boolean {
    return value === null || value === '';
  }

  protected createNew(): void {
    this.requestSession.reset();
    void this.router.navigateByUrl('/');
  }
}
