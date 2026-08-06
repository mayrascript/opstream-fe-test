import { FormControl, FormRecord, Validators } from '@angular/forms';
import {
  AnswerControl,
  AnswerValue,
  RequestFormGroup,
  RequestSchema,
  SectionFormGroup,
} from '../models/request.models';

export function buildRequestForm(schema: RequestSchema): RequestFormGroup {
  const form: RequestFormGroup = new FormRecord<SectionFormGroup>({});

  for (const section of schema.sections) {
    const sectionGroup: SectionFormGroup = new FormRecord<AnswerControl>({});

    for (const field of section.fields) {
      const initialValue = field.default ?? null;
      const validators = field.required ? [Validators.required] : [];
      sectionGroup.addControl(
        String(field.id),
        new FormControl<AnswerValue>(initialValue, { validators }),
      );
    }

    form.addControl(section.id, sectionGroup);
  }

  return form;
}

export function serializeAnswers(form: RequestFormGroup): Record<string, AnswerValue> {
  const answers: Record<string, AnswerValue> = {};

  for (const section of Object.values(form.controls)) {
    for (const [questionId, control] of Object.entries(section.controls)) {
      answers[questionId] = control.value;
    }
  }

  return answers;
}
