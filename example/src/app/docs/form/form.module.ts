import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormDocComponent } from './form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MyLibModule } from '@releasium/ngx-grand-validator';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MyLibModule,
  ],
  declarations: [
    FormDocComponent,
  ],
  exports: [
    FormDocComponent,
  ]
})
export class FormDocModule {}
