import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { REQUEST_SCHEMAS } from '../../../core/data/request-schemas';
import { RequestSchema } from '../../../core/models/request.models';
import { MockRequestApi } from '../../../core/services/mock-request-api';
import { RequestSessionService } from '../services/request-session';
import { RequestSummaryPage } from './request-summary-page/request-summary-page';
import { RequestWizardPage } from './request-wizard-page/request-wizard-page';
import { SchemaChooserPage } from './schema-chooser-page/schema-chooser-page';

class IntegrationApi {
  schemasResponse: Observable<RequestSchema[]> = of(REQUEST_SCHEMAS);

  getSchemas(): Observable<RequestSchema[]> {
    return this.schemasResponse;
  }

  saveAnswer(): Observable<void> {
    return of(undefined);
  }
}

describe('request routing flow', () => {
  let harness: RouterTestingHarness;
  let api: IntegrationApi;
  let session: RequestSessionService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: SchemaChooserPage },
          { path: 'request/:schemaId/:sectionId', component: RequestWizardPage },
          { path: 'summary/:requestId', component: RequestSummaryPage },
        ]),
        { provide: MockRequestApi, useClass: IntegrationApi },
      ],
    });
    api = TestBed.inject(MockRequestApi) as unknown as IntegrationApi;
    session = TestBed.inject(RequestSessionService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => session.reset());

  it('keeps the loading region free of broken heading references', async () => {
    api.schemasResponse = NEVER;
    await harness.navigateByUrl('/', SchemaChooserPage);
    const loadingRegion = harness.routeNativeElement!.querySelector('.chooser-page')!;

    expect(loadingRegion.getAttribute('aria-label')).toBe('Loading request types');
    expect(loadingRegion.hasAttribute('aria-labelledby')).toBe(false);
    expect(loadingRegion.querySelector('#chooser-title')).toBeNull();
  });

  it('keeps the error region free of broken heading references', async () => {
    api.schemasResponse = throwError(() => new Error('Unavailable'));
    await harness.navigateByUrl('/', SchemaChooserPage);
    await harness.fixture.whenStable();
    const errorRegion = harness.routeNativeElement!.querySelector('.chooser-page')!;

    expect(errorRegion.getAttribute('aria-label')).toBe('Request types unavailable');
    expect(errorRegion.hasAttribute('aria-labelledby')).toBe(false);
    expect(errorRegion.querySelector('[role="alert"]')?.textContent).toContain(
      'We could not load the request types.',
    );
  });

  it('selects one purchase category before starting the request', async () => {
    await harness.navigateByUrl('/', SchemaChooserPage);
    await harness.fixture.whenStable();
    const element = harness.routeNativeElement! as HTMLElement;
    const chips = element.querySelectorAll<HTMLButtonElement>('.schema-chip');
    expect([...chips].map((chip) => chip.textContent?.trim())).toEqual(['Software', 'Hardware']);
    expect(chips[0].getAttribute('aria-pressed')).toBe('false');
    expect(chips[1].getAttribute('aria-pressed')).toBe('false');

    chips[1].click();
    await harness.fixture.whenStable();
    expect(chips[0].getAttribute('aria-pressed')).toBe('false');
    expect(chips[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('announces a missing category and starts only after a selection', async () => {
    await harness.navigateByUrl('/', SchemaChooserPage);
    await harness.fixture.whenStable();
    const element = harness.routeNativeElement! as HTMLElement;
    const start = [...element.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent?.trim() === 'Start',
    )!;

    start.click();
    await harness.fixture.whenStable();
    expect(element.textContent).toContain('Choose what you need to purchase before starting.');
    expect(document.activeElement).toBe(element.querySelector('.schema-chip'));
    expect(router.url).toBe('/');

    element.querySelector<HTMLButtonElement>('.schema-chip')!.click();
    start.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/request/software-request/requested-item');
    expect(document.activeElement?.textContent).toContain('Requested Item');
  });

  it('blocks invalid navigation and focuses the first missing answer', async () => {
    session.start(REQUEST_SCHEMAS[0]);
    await harness.navigateByUrl('/request/software-request/requested-item', RequestWizardPage);
    const element = harness.routeNativeElement! as HTMLElement;
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();

    expect(router.url).toBe('/request/software-request/requested-item');
    expect(document.activeElement?.id).toBe('question-1758177604');
    expect(element.textContent).toContain('This field is required');
  });

  it('validates clickable page navigation and renders schema radios on page two', async () => {
    session.start(REQUEST_SCHEMAS[0]);
    await harness.navigateByUrl('/request/software-request/requested-item', RequestWizardPage);
    const element = harness.routeNativeElement! as HTMLElement;
    const pageTwo = [...element.querySelectorAll<HTMLButtonElement>('nav button')].find((button) =>
      button.textContent?.includes('Page 2'),
    )!;

    pageTwo.click();
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
    expect(router.url).toBe('/request/software-request/requested-item');
    expect(document.activeElement?.id).toBe('question-1758177604');

    const requestedItem = session.form()!.controls['requested-item'];
    requestedItem.controls['1758177604'].setValue('Design software');
    requestedItem.controls['75484637462'].setValue(2);
    pageTwo.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/request/software-request/vendor-info');
    expect(document.activeElement?.textContent).toContain('Vendor Information');
    expect(
      [...element.querySelectorAll<HTMLElement>('.radio-option span')].map((option) =>
        option.textContent?.trim(),
      ),
    ).toEqual(['USA', 'UK', 'Other']);

    const pageOne = [...element.querySelectorAll<HTMLButtonElement>('nav button')].find((button) =>
      button.textContent?.includes('Page 1'),
    )!;
    pageOne.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/request/software-request/requested-item');
  });

  it('moves between sections while preserving answers', async () => {
    session.start(REQUEST_SCHEMAS[0]);
    await harness.navigateByUrl('/request/software-request/requested-item', RequestWizardPage);
    const firstGroup = session.form()!.controls['requested-item'];
    firstGroup.controls['1758177604'].setValue('Design software');
    firstGroup.controls['75484637462'].setValue(3);
    (harness.routeNativeElement! as HTMLElement)
      .querySelector<HTMLButtonElement>('button[type="submit"]')!
      .click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/request/software-request/vendor-info');
    expect(document.activeElement?.textContent).toContain('Vendor Information');
    (harness.routeNativeElement! as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('button')[0]
      .click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/request/software-request/requested-item');
    expect(document.activeElement?.textContent).toContain('Requested Item');
    expect(firstGroup.controls['1758177604'].value).toBe('Design software');
  });

  it('returns to the first invalid section when submitting from a direct final-section route', async () => {
    session.start(REQUEST_SCHEMAS[0]);
    const vendor = session.form()!.controls['vendor-info'];
    vendor.controls['4957463729'].setValue('Vendor');
    vendor.controls['8462736152'].setValue('USA');
    await harness.navigateByUrl('/request/software-request/vendor-info', RequestWizardPage);

    (harness.routeNativeElement! as HTMLElement)
      .querySelector<HTMLButtonElement>('button[type="submit"]')!
      .click();
    await harness.fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();

    expect(router.url).toBe('/request/software-request/requested-item');
    expect(document.activeElement?.id).toBe('question-1758177604');
  });

  it('redirects direct request routes when no in-memory session exists', async () => {
    await harness.navigateByUrl('/request/software-request/requested-item');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/');
  });

  it('renders a read-only summary and clears the completed session', async () => {
    session.start(REQUEST_SCHEMAS[1]);
    const form = session.form()!;
    form.controls['requested-item'].controls['75329829348985'].setValue('Laptop');
    form.controls['requested-item'].controls['2389182391823812'].setValue(true);
    const summary = session.captureSummary()!;

    await harness.navigateByUrl(`/summary/${summary.requestId}`, RequestSummaryPage);
    const element = harness.routeNativeElement! as HTMLElement;
    expect(element.textContent).toContain('Awesome!');
    expect(element.textContent).toContain('Laptop');
    expect(element.textContent).toContain('Yes');
    expect(element.textContent).toContain('Not provided');
    expect(document.activeElement?.textContent).toContain('Awesome!');

    element.querySelector<HTMLButtonElement>('button')!.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/');
    expect(session.session()).toBeNull();
    expect(document.activeElement?.textContent).toContain('What do you need to purchase?');
  });
});
