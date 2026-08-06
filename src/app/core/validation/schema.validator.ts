import { FieldType, RequestSchema } from '../models/request.models';

const FIELD_TYPES = new Set<FieldType>(['text', 'number', 'radio', 'toggle']);

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export function validateSchemas(schemas: RequestSchema[]): RequestSchema[] {
  const questionIds = new Set<number>();

  for (const schema of schemas) {
    if (!schema.id || !schema.title || schema.sections.length === 0) {
      throw new SchemaValidationError('A schema is missing its identity or sections.');
    }

    for (const section of schema.sections) {
      if (!section.id || !section.title || section.fields.length === 0) {
        throw new SchemaValidationError(`Schema ${schema.id} contains an invalid section.`);
      }

      for (const field of section.fields) {
        if (!FIELD_TYPES.has(field.type)) {
          throw new SchemaValidationError(`Question ${field.id} has an unsupported type.`);
        }
        if (questionIds.has(field.id)) {
          throw new SchemaValidationError(`Question ID ${field.id} is duplicated.`);
        }
        if (field.type === 'radio' && (!field.options || field.options.length === 0)) {
          throw new SchemaValidationError(`Radio question ${field.id} requires options.`);
        }
        questionIds.add(field.id);
      }
    }
  }

  return schemas;
}
