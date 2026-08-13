import { FormControl, FormRecord } from '@angular/forms';
import { AnswerValue } from '../models/request.models';

export type AnswerControl = FormControl<AnswerValue>;
export type SectionFormGroup = FormRecord<AnswerControl>;
export type RequestFormGroup = FormRecord<SectionFormGroup>;
