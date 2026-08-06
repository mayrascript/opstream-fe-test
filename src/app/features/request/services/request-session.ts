import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  firstValueFrom,
  map,
  retry,
  Subscription,
  switchMap,
  take,
  tap,
  timer,
  timeout,
} from 'rxjs';
import { buildRequestForm, serializeAnswers } from '../../../core/forms/request-form.factory';
import {
  AnswerControl,
  AnswerValue,
  QuestionSaveState,
  RequestFormGroup,
  RequestSchema,
  RequestSession,
  RequestSummary,
} from '../../../core/models/request.models';
import { MockRequestApi } from '../../../core/services/mock-request-api';

@Injectable({ providedIn: 'root' })
export class RequestSessionService {
  private readonly api = inject(MockRequestApi);
  private readonly schemaState = signal<RequestSchema | null>(null);
  private readonly formState = signal<RequestFormGroup | null>(null);
  private readonly sessionState = signal<RequestSession | null>(null);
  private readonly summaryState = signal<RequestSummary | null>(null);
  private readonly saveState = signal<ReadonlyMap<number, QuestionSaveState>>(new Map());
  private subscriptions = new Subscription();

  readonly schema = this.schemaState.asReadonly();
  readonly form = this.formState.asReadonly();
  readonly session = this.sessionState.asReadonly();
  readonly summary = this.summaryState.asReadonly();
  readonly saveStates = this.saveState.asReadonly();
  readonly hasPendingSaves = computed(() =>
    [...this.saveState().values()].some(
      ({ status }) => status === 'saving' || status === 'retrying',
    ),
  );
  readonly hasSaveErrors = computed(() =>
    [...this.saveState().values()].some(({ status }) => status === 'error'),
  );
  private readonly savesSettled = computed(() => !this.hasPendingSaves());
  private readonly savesSettled$ = toObservable(this.savesSettled);

  start(schema: RequestSchema): RequestSession {
    this.reset();

    const form = buildRequestForm(schema);
    const session: RequestSession = {
      requestId: this.createRequestId(),
      schemaId: schema.id,
      answers: serializeAnswers(form),
    };

    this.schemaState.set(schema);
    this.formState.set(form);
    this.sessionState.set(session);
    this.registerAutosave(schema, form);
    return session;
  }

  getQuestionState(questionId: number): QuestionSaveState | undefined {
    return this.saveState().get(questionId);
  }

  retryQuestion(questionId: number): void {
    const control = this.findControl(questionId);
    if (!control || !this.sessionState()) {
      return;
    }

    this.subscriptions.add(this.persist(questionId, control.value).subscribe());
  }

  async waitForSaves(): Promise<boolean> {
    if (!this.hasPendingSaves()) {
      return !this.hasSaveErrors();
    }

    try {
      await firstValueFrom(this.savesSettled$.pipe(filter(Boolean), take(1), timeout(15000)));
      return !this.hasSaveErrors();
    } catch {
      return false;
    }
  }

  captureSummary(): RequestSummary | null {
    const form = this.formState();
    const session = this.sessionState();
    if (!form || !session) {
      return null;
    }

    const answers = serializeAnswers(form);
    const summary: RequestSummary = {
      requestId: session.requestId,
      schemaId: session.schemaId,
      createdAt: new Date(),
      answers,
    };
    this.sessionState.set({ ...session, answers });
    this.summaryState.set(summary);
    return summary;
  }

  reset(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.schemaState.set(null);
    this.formState.set(null);
    this.sessionState.set(null);
    this.summaryState.set(null);
    this.saveState.set(new Map());
  }

  private registerAutosave(schema: RequestSchema, form: RequestFormGroup): void {
    for (const section of schema.sections) {
      const sectionGroup = form.controls[section.id];
      for (const field of section.fields) {
        const control = sectionGroup.controls[String(field.id)];
        this.subscriptions.add(
          control.valueChanges
            .pipe(
              distinctUntilChanged(),
              tap((value) => {
                this.updateSessionAnswer(field.id, value);
                this.setQuestionState(field.id, { status: 'saving', error: undefined });
              }),
              debounceTime(750),
              switchMap((value) => this.persist(field.id, value)),
            )
            .subscribe(),
        );
      }
    }
  }

  private persist(questionId: number, value: AnswerValue) {
    const session = this.sessionState();
    if (!session) {
      return EMPTY;
    }

    return defer(() => {
      this.setQuestionState(questionId, { status: 'saving', error: undefined });
      return this.api.saveAnswer(session.requestId, questionId, value);
    }).pipe(
      retry({
        count: 2,
        delay: (_error, retryCount) => {
          this.setQuestionState(questionId, { status: 'retrying', error: undefined });
          return timer(retryCount === 1 ? 500 : 1000);
        },
      }),
      tap(() =>
        this.setQuestionState(questionId, {
          status: 'saved',
          lastSavedAt: new Date(),
          error: undefined,
        }),
      ),
      catchError((error: unknown) => {
        this.setQuestionState(questionId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'The answer could not be saved.',
        });
        return EMPTY;
      }),
      map(() => undefined),
    );
  }

  private setQuestionState(
    questionId: number,
    changes: Omit<Partial<QuestionSaveState>, 'questionId'>,
  ): void {
    const next = new Map(this.saveState());
    const current = next.get(questionId) ?? { questionId, status: 'idle' as const };
    next.set(questionId, { ...current, ...changes, questionId });
    this.saveState.set(next);
  }

  private updateSessionAnswer(questionId: number, value: AnswerValue): void {
    const session = this.sessionState();
    if (session) {
      this.sessionState.set({
        ...session,
        answers: { ...session.answers, [String(questionId)]: value },
      });
    }
  }

  private findControl(questionId: number): AnswerControl | undefined {
    const form = this.formState();
    if (!form) {
      return undefined;
    }

    for (const section of Object.values(form.controls)) {
      const control = section.controls[String(questionId)];
      if (control) {
        return control;
      }
    }
    return undefined;
  }

  private createRequestId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `request-${Date.now()}`;
  }
}
