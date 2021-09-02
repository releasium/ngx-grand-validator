import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { homeRoutes } from './home/home.routes';
import { aboutRoutes } from './about/about.routes';

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
  {
    path: 'docs',
    loadChildren: () => import('./docs/docs.module').then(m => m.DocsModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
