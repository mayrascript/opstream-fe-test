import { TestBed } from '@angular/core/testing';
import { REQUEST_SCHEMAS } from '../../../../core/data/request-schemas';
import { WizardProgress } from './wizard-progress';

describe('WizardProgress', () => {
  it('renders native page buttons and emits the selected section', async () => {
    const fixture = TestBed.createComponent(WizardProgress);
    const selectedSections: string[] = [];
    fixture.componentRef.setInput('sections', REQUEST_SCHEMAS[0].sections);
    fixture.componentRef.setInput('activeIndex', 0);
    fixture.componentInstance.sectionSelected.subscribe((sectionId) =>
      selectedSections.push(sectionId),
    );
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = element.querySelectorAll<HTMLButtonElement>('button');
    expect([...buttons].map((button) => button.textContent?.trim())).toEqual([
      'Page 1: Requested Item',
      'Page 2: Vendor Information',
    ]);
    expect(buttons[0].getAttribute('aria-current')).toBe('step');
    expect(buttons[1].hasAttribute('aria-current')).toBe(false);

    buttons[1].click();
    expect(selectedSections).toEqual(['vendor-info']);
  });
});
