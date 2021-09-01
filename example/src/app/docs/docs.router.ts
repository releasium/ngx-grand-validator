import { Routes } from '@angular/router';

import { docsFormRoutes } from './form/form.router';
import { gettingStartedRoutes } from './getting-started/getting-started.router';
import { validatorsRoutes } from './validators/validators.router';
import { testingRoutes } from './testing/testing.router';

export const docsRoutes: Routes = [
  {
    path: 'docs',
    children: [
      {
        path: '',
        redirectTo: gettingStartedRoutes[0].path,
        pathMatch: 'full',
      },
      ...gettingStartedRoutes,
      ...docsFormRoutes,
      ...validatorsRoutes,
      ...testingRoutes
    ]
  },
];
