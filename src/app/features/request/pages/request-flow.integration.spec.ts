import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { REQUEST_SCHEMAS } from '../../../core/data/request-schemas';
import { RequestSchema } from '../../../core/models/request.models';
import { MockRequestApi } from '../../../core/services/mock-request-api';
import { RequestSessionService } from '../services/request-session';
import { RequestSummaryPage } from './request-summary-page/request-summary-page';
import { RequestWizardPage } from './request-wizard-page/request-wizard-page';
import { SchemaChooserPage } from './schema-chooser-page/schema-chooser-page';

class IntegrationApi {
  getSchemas(): Observable<RequestSchema[]> {
    return of(REQUEST_SCHEMAS);
  }

  saveAnswer(): Observable<void> {
    return of(undefined);
  }
}

describe('request routing flow', () => {
  let harness: RouterTestingHarness;
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
    session = TestBed.inject(RequestSessionService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => session.reset());

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
