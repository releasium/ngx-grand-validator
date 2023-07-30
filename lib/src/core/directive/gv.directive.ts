import { Directive, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { GVModel, IGVModelStatic } from '../gv';
import { FormMessage } from '../../components/error-message/form-msg.type';

@Directive({
  selector: '[GV]'
})
export class GVDirective implements OnInit {
  @Input() GV!: IGVModelStatic<GVModel>;
  @Input() formMsgGroup!: FormMessage;
  @Input() formGroupName: string = '';

  constructor(@Optional() @Host() @SkipSelf() private gvDirective: GVDirective) {}

  ngOnInit() {
    if (!this.GV || !this.GV.genUIMsg) {
      throw '[GV]="???" value is reuqired for GV directive. Add your GVModel'
    }
    this.formMsgGroup = this.GV.genUIMsg();
    this.formMsgGroup = this.formMsgGroup || this.gvDirective.formMsgGroup[this.formGroupName];
  }
}
