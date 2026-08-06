import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { AnswerValue, FieldType, SchemaField } from '../../../../core/models/request.models';
import { DynamicField } from './dynamic-field';

describe('DynamicField', () => {
  let fixture: ComponentFixture<DynamicField>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DynamicField] });
    fixture = TestBed.createComponent(DynamicField);
  });

  async function render(type: FieldType, options?: string[]): Promise<HTMLElement> {
    const field: SchemaField = { id: 42, label: 'Question', type, options };
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('control', new FormControl<AnswerValue>(null));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it.each([
    ['text', 'input[type="text"]'],
    ['number', 'input[type="number"]'],
    ['toggle', 'input[role="switch"]'],
  ] as const)('renders the %s field renderer', async (type, selector) => {
    expect((await render(type)).querySelector(selector)).not.toBeNull();
  });

  it('renders native radios for every option', async () => {
    const element = await render('radio', ['USA', 'UK', 'Other']);
    expect(element.querySelectorAll('input[type="radio"]')).toHaveLength(3);
  });

  it('shows a connected error after a navigation attempt', async () => {
    const control = new FormControl<AnswerValue>(null, { nonNullable: false });
    control.setErrors({ required: true });
    fixture.componentRef.setInput('field', {
      id: 42,
      label: 'Question',
      type: 'text',
      required: true,
    });
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('attempted', true);
    await fixture.whenStable();

    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('question-42-error');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('This field is required');
  });
});
