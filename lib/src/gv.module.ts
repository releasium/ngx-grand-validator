import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GV_DEFAULT_ERROR_MESSAGES, GV_ERROR_MESSAGES, GVErrorMessageComponent } from './components';
import { GVService, GVDirective } from './core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
    GVDirective,
    GVErrorMessageComponent,
  ],
  exports: [
    GVDirective,
    GVErrorMessageComponent
  ],
})
export class GVModule {
  static forRoot(): ModuleWithProviders<GVModule> {
    return {
      ngModule: GVModule,
      providers: [
        GVService,
        {
          provide: GV_ERROR_MESSAGES,
          useValue: GV_DEFAULT_ERROR_MESSAGES
        }
      ]
    }
  }
}
