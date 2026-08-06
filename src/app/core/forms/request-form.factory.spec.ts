import { REQUEST_SCHEMAS } from '../data/request-schemas';
import { buildRequestForm, serializeAnswers } from './request-form.factory';

describe('request form factory', () => {
  it('builds every section and question from a schema', () => {
    const schema = REQUEST_SCHEMAS[0];
    const form = buildRequestForm(schema);

    expect(Object.keys(form.controls)).toEqual(['requested-item', 'vendor-info']);
    expect(Object.keys(form.controls['vendor-info'].controls)).toEqual([
      '4957463729',
      '8462736152',
      '6482937561',
    ]);
  });

  it('applies required validation and keeps numbers as numbers', () => {
    const form = buildRequestForm(REQUEST_SCHEMAS[0]);
    const item = form.controls['requested-item'];

    expect(item.controls['1758177604'].hasError('required')).toBe(true);
    item.controls['75484637462'].setValue(4);
    expect(item.controls['75484637462'].value).toBe(4);
    expect(item.valid).toBe(false);
  });

  it('applies toggle defaults and serializes a stable answer record', () => {
    const form = buildRequestForm(REQUEST_SCHEMAS[1]);
    expect(form.controls['requested-item'].controls['2389182391823812'].value).toBe(false);

    form.controls['requested-item'].controls['75329829348985'].setValue('Laptop');
    expect(serializeAnswers(form)['75329829348985']).toBe('Laptop');
  });

  it('supports new schema sections and questions without form changes', () => {
    const form = buildRequestForm({
      id: 'custom',
      title: 'Custom',
      sections: [
        { id: 'approval', title: 'Approval', fields: [{ id: 99, label: 'Code', type: 'text' }] },
      ],
    });

    expect(form.controls['approval'].controls['99']).toBeDefined();
  });
});
