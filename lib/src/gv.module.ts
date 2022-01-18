import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GVDirective } from './core/directive/gv.directive';
import { GV_DEFAULT_ERROR_MESSAGES, GV_ERROR_MESSAGES, GVErrorMessageComponent } from './components';

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
        {
          provide: GV_ERROR_MESSAGES,
          useValue: GV_DEFAULT_ERROR_MESSAGES
        }
      ]
    }
  }
}
