import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { homeRoutes } from './home/home.routes';
import { aboutRoutes } from './about/about.routes';
import { docsRoutes } from './docs/docs.router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    children: [
      ...homeRoutes
    ]
  },
  {
    path: 'about',
    children: [
      ...aboutRoutes
    ]
  },
  ...docsRoutes
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
