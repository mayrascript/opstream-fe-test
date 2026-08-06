import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Choose a request · Opstream',
    loadComponent: () =>
      import('./features/request/pages/schema-chooser-page/schema-chooser-page').then(
        (module) => module.SchemaChooserPage,
      ),
  },
  {
    path: 'request/:schemaId/:sectionId',
    title: 'Request details · Opstream',
    loadComponent: () =>
      import('./features/request/pages/request-wizard-page/request-wizard-page').then(
        (module) => module.RequestWizardPage,
      ),
  },
  {
    path: 'summary/:requestId',
    title: 'Request summary · Opstream',
    loadComponent: () =>
      import('./features/request/pages/request-summary-page/request-summary-page').then(
        (module) => module.RequestSummaryPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
