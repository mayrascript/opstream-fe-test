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
    (harness.routeNativeElement! as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('button')[0]
      .click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/request/software-request/requested-item');
    expect(firstGroup.controls['1758177604'].value).toBe('Design software');
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
    expect(element.textContent).toContain('Laptop');
    expect(element.textContent).toContain('Yes');
    expect(element.textContent).toContain('Not provided');

    element.querySelector<HTMLButtonElement>('button')!.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/');
    expect(session.session()).toBeNull();
  });
});
