import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SaveStatusIndicator } from './save-status-indicator';

describe('SaveStatusIndicator', () => {
  let fixture: ComponentFixture<SaveStatusIndicator>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SaveStatusIndicator] });
    fixture = TestBed.createComponent(SaveStatusIndicator);
    fixture.componentRef.setInput('fieldLabel', 'Item Name');
  });

  async function setStatus(status: 'idle' | 'saving' | 'retrying' | 'saved' | 'error') {
    fixture.componentRef.setInput('state', { status });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it.each([
    ['saving', 'Item Name: saving.'],
    ['retrying', 'Item Name: save failed. Retrying.'],
    ['saved', 'Item Name: saved.'],
    ['error', 'Item Name: not saved. Retry is required.'],
  ] as const)('announces the %s state with field context', async (status, message) => {
    const element = await setStatus(status);
    expect(element.querySelector('[aria-live="polite"]')?.textContent?.trim()).toBe(message);
  });

  it('keeps the polite live region mounted while idle', async () => {
    const element = await setStatus('idle');
    expect(element.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(element.querySelector('[aria-live="polite"]')?.textContent?.trim()).toBe('');
  });

  it('prevents duplicate retry activation while a retry is pending', async () => {
    const listener = vi.fn();
    fixture.componentInstance.retryRequested.subscribe(listener);
    const element = await setStatus('error');
    const retry = element.querySelector<HTMLButtonElement>('[data-save-retry]')!;

    retry.click();
    retry.click();
    await fixture.whenStable();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(retry.getAttribute('aria-disabled')).toBe('true');
    expect(retry.textContent).toContain('Retrying');
  });

  it('moves focus to the persistent status after a successful retry', async () => {
    const element = await setStatus('error');
    const retry = element.querySelector<HTMLButtonElement>('[data-save-retry]')!;
    retry.focus();
    retry.click();
    await setStatus('saving');
    await setStatus('saved');
    await fixture.whenStable();

    expect(document.activeElement).toBe(element.querySelector('[role="group"]'));
    expect(element.querySelector('[data-save-retry]')).toBeNull();
  });
});
