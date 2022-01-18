import { Directive, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';

@Directive({
  selector: '[GV]'
})
export class GVDirective implements OnInit {
  @Input() gvModel: any;
  @Input() formMsgGroup: any;
  @Input() formGroupName: string = '';

  constructor(@Optional() @Host() @SkipSelf() private gvDirective: GVDirective) {}

  ngOnInit() {
    if (!this.gvModel) {
      throw '[gvModel] attribute is required for GV directive'
    }
    this.formMsgGroup = this.gvModel.genUIMsg();
    this.formMsgGroup = this.formMsgGroup || this.gvDirective.formMsgGroup[this.formGroupName];
  }
}
