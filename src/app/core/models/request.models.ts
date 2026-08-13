export type FieldType = 'text' | 'number' | 'radio' | 'toggle';
export type AnswerValue = string | number | boolean | null;
export type SaveStatus = 'idle' | 'saving' | 'retrying' | 'saved' | 'error';
export type SchemaIcon = 'software' | 'hardware' | 'generic';

export interface RequestSchema {
  id: string;
  title: string;
  icon?: SchemaIcon;
  sections: SchemaSection[];
}

export interface SchemaSection {
  id: string;
  title: string;
  fields: SchemaField[];
}

export interface SchemaField {
  id: number;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: AnswerValue;
  options?: string[];
}

export interface RequestSession {
  requestId: string;
  schemaId: string;
  answers: Record<string, AnswerValue>;
}

export interface QuestionSaveState {
  questionId: number;
  status: SaveStatus;
  lastSavedAt?: Date;
  error?: string;
}

export interface RequestSummary {
  requestId: string;
  schemaId: string;
  createdAt: Date;
  answers: Record<string, AnswerValue>;
}
