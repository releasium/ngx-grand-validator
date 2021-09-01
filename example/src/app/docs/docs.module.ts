import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DocsComponent } from './docs.component';
import { GettingStartedComponent } from './getting-started/getting-started.component';
import { ValidatorsComponent } from './validators/validators.component';
import { TestingComponent } from './testing/testing.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule,
	],
  declarations: [
    DocsComponent,
    GettingStartedComponent,
    ValidatorsComponent,
    TestingComponent,
  ],
  exports: [
    DocsComponent,
  ]
})
export class DocsModule {}
