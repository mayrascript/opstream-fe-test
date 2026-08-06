import { computed, Injectable, signal } from '@angular/core';
import { buildRequestForm, serializeAnswers } from '../../../core/forms/request-form.factory';
import {
  QuestionSaveState,
  RequestFormGroup,
  RequestSchema,
  RequestSession,
  RequestSummary,
} from '../../../core/models/request.models';

@Injectable({ providedIn: 'root' })
export class RequestSessionService {
  private readonly schemaState = signal<RequestSchema | null>(null);
  private readonly formState = signal<RequestFormGroup | null>(null);
  private readonly sessionState = signal<RequestSession | null>(null);
  private readonly summaryState = signal<RequestSummary | null>(null);
  private readonly saveState = signal<ReadonlyMap<number, QuestionSaveState>>(new Map());

  readonly schema = this.schemaState.asReadonly();
  readonly form = this.formState.asReadonly();
  readonly session = this.sessionState.asReadonly();
  readonly summary = this.summaryState.asReadonly();
  readonly saveStates = this.saveState.asReadonly();
  readonly hasPendingSaves = computed(() => false);
  readonly hasSaveErrors = computed(() => false);

  start(schema: RequestSchema): RequestSession {
    this.reset();
    const form = buildRequestForm(schema);
    const session: RequestSession = {
      requestId: globalThis.crypto?.randomUUID?.() ?? `request-${Date.now()}`,
      schemaId: schema.id,
      answers: serializeAnswers(form),
    };
    this.schemaState.set(schema);
    this.formState.set(form);
    this.sessionState.set(session);
    return session;
  }

  getQuestionState(questionId: number): QuestionSaveState | undefined {
    return this.saveState().get(questionId);
  }

  retryQuestion(questionId: number): void {
    void questionId;
  }

  async waitForSaves(): Promise<boolean> {
    return true;
  }

  captureSummary(): RequestSummary | null {
    const form = this.formState();
    const session = this.sessionState();
    if (!form || !session) {
      return null;
    }
    const answers = serializeAnswers(form);
    const summary = {
      requestId: session.requestId,
      schemaId: session.schemaId,
      createdAt: new Date(),
      answers,
    };
    this.summaryState.set(summary);
    return summary;
  }

  reset(): void {
    this.schemaState.set(null);
    this.formState.set(null);
    this.sessionState.set(null);
    this.summaryState.set(null);
    this.saveState.set(new Map());
  }
}
