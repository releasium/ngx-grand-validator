import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DocsComponent } from './docs.component';
import { gettingStartedRoutes } from './getting-started/getting-started.router';
import { docsFormRoutes } from './form/form.router';
import { validatorsRoutes } from './validators/validators.router';
import { testingRoutes } from './testing/testing.router';

const routes: Routes = [
  {
    path: '',
    component: DocsComponent,
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

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class DocsRoutingModule {}
