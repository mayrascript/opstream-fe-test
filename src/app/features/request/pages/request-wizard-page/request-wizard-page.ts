import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SectionFormGroup } from '../../../../core/forms/request-form.types';
import { SchemaSection } from '../../../../core/models/request.models';
import { SectionForm } from '../../components/section-form/section-form';
import { WizardProgress } from '../../components/wizard-progress/wizard-progress';
import { RequestSessionService } from '../../services/request-session';

@Component({
  selector: 'app-request-wizard-page',
  imports: [SectionForm, WizardProgress],
  templateUrl: './request-wizard-page.html',
  styleUrl: './request-wizard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestWizardPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  protected readonly requestSession = inject(RequestSessionService);

  protected readonly activeIndex = signal(0);
  protected readonly activeSection = signal<SchemaSection | null>(null);
  protected readonly activeGroup = signal<SectionFormGroup | null>(null);
  protected readonly attempted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly validationAnnouncement = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const schema = this.requestSession.schema();
      const form = this.requestSession.form();
      const schemaId = params.get('schemaId');
      const sectionId = params.get('sectionId');

      if (!schema || !form || schema.id !== schemaId) {
        void this.router.navigateByUrl('/', { replaceUrl: true });
        return;
      }

      const index = schema.sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        void this.router.navigate(['/request', schema.id, schema.sections[0].id], {
          replaceUrl: true,
        });
        return;
      }

      this.activeIndex.set(index);
      this.activeSection.set(schema.sections[index]);
      this.activeGroup.set(form.controls[schema.sections[index].id]);
      this.attempted.set(false);
      this.validationAnnouncement.set('');
    });
  }

  protected previous(): void {
    const schema = this.requestSession.schema();
    const previousSection = schema?.sections[this.activeIndex() - 1];
    if (schema && previousSection) {
      void this.router.navigate(['/request', schema.id, previousSection.id]);
    }
  }

  protected next(): void {
    if (!this.validateSection()) {
      return;
    }

    const schema = this.requestSession.schema();
    const nextSection = schema?.sections[this.activeIndex() + 1];
    if (schema && nextSection) {
      void this.router.navigate(['/request', schema.id, nextSection.id]);
    }
  }

  protected async submit(): Promise<void> {
    if (!(await this.validateRequest())) {
      return;
    }

    this.submitting.set(true);
    if (this.requestSession.hasPendingSaves()) {
      this.validationAnnouncement.set('Waiting for your latest answers to finish saving.');
    }

    const savesSucceeded = await this.requestSession.waitForSaves();
    if (!savesSucceeded) {
      this.submitting.set(false);
      this.validationAnnouncement.set(
        'One or more answers could not be saved. Use Retry beside the affected answer before submitting.',
      );
      return;
    }

    const summary = this.requestSession.captureSummary();
    if (summary) {
      await this.router.navigate(['/summary', summary.requestId]);
    }
    this.submitting.set(false);
  }

  protected retryQuestion(questionId: number): void {
    this.requestSession.retryQuestion(questionId);
  }

  private validateSection(): boolean {
    const group = this.activeGroup();
    if (!group || group.valid) {
      return true;
    }

    this.attempted.set(true);
    group.markAllAsTouched();
    this.validationAnnouncement.set(
      'Some required information is missing. Review the highlighted fields.',
    );
    this.focusFirstInvalid();
    return false;
  }

  private async validateRequest(): Promise<boolean> {
    const schema = this.requestSession.schema();
    const form = this.requestSession.form();
    if (!schema || !form || form.valid) {
      return true;
    }

    form.markAllAsTouched();
    const invalidIndex = schema.sections.findIndex((section) => form.controls[section.id]?.invalid);
    if (invalidIndex >= 0 && invalidIndex !== this.activeIndex()) {
      const invalidSection = schema.sections[invalidIndex];
      await this.router.navigate(['/request', schema.id, invalidSection.id]);
    }

    this.attempted.set(true);
    this.validationAnnouncement.set(
      'Some required information is missing. Review the highlighted fields.',
    );
    this.focusFirstInvalid();
    return false;
  }

  private focusFirstInvalid(): void {
    const section = this.activeSection();
    const group = this.activeGroup();
    const firstInvalidId = section?.fields.find(
      (field) => group?.controls[String(field.id)]?.invalid,
    )?.id;
    if (firstInvalidId === undefined) {
      return;
    }

    afterNextRender(
      () => {
        const firstInvalid = document.querySelector<HTMLElement>(
          `#question-${firstInvalidId}, [data-question-id="${firstInvalidId}"]`,
        );
        firstInvalid?.focus();
      },
      { injector: this.injector },
    );
  }
}
