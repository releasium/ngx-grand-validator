import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormDocComponent } from './form.component';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    FormDocComponent,
  ],
  exports: [
    FormDocComponent,
  ]
})
export class FormDocModule {}
