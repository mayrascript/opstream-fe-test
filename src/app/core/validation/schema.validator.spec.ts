import { RequestSchema } from '../models/request.models';
import { SchemaValidationError, validateSchemas } from './schema.validator';

function schemaWith(field: RequestSchema['sections'][number]['fields'][number]): RequestSchema[] {
  return [
    {
      id: 'test',
      title: 'Test',
      sections: [{ id: 'details', title: 'Details', fields: [field] }],
    },
  ];
}

describe('schema validator', () => {
  it('accepts a valid schema', () => {
    const schemas = schemaWith({ id: 1, label: 'Name', type: 'text' });
    expect(validateSchemas(schemas)).toBe(schemas);
  });

  it('rejects radios without options', () => {
    expect(() => validateSchemas(schemaWith({ id: 1, label: 'Place', type: 'radio' }))).toThrow(
      SchemaValidationError,
    );
  });

  it('rejects unsupported field types', () => {
    const schemas = schemaWith({ id: 1, label: 'File', type: 'file' as never });
    expect(() => validateSchemas(schemas)).toThrow('unsupported type');
  });

  it('rejects duplicate question ids across schemas', () => {
    const schemas = [
      ...schemaWith({ id: 1, label: 'First', type: 'text' }),
      { ...schemaWith({ id: 1, label: 'Second', type: 'number' })[0], id: 'second' },
    ];
    expect(() => validateSchemas(schemas)).toThrow('duplicated');
  });

  it('rejects schemas and sections without required structure', () => {
    expect(() => validateSchemas([{ id: '', title: '', sections: [] }])).toThrow('identity');
    expect(() =>
      validateSchemas([{ id: 'x', title: 'X', sections: [{ id: '', title: '', fields: [] }] }]),
    ).toThrow('invalid section');
  });
});
