import { Component, Host, Inject, Input, OnDestroy, OnInit, Optional, SkipSelf } from '@angular/core';
import { AbstractControl, ControlContainer, FormControlStatus } from '@angular/forms';

import { Subscription } from 'rxjs';
import { ErrorMessages, GV_ERROR_MESSAGES } from './default-msgs';
import { FormMessage } from './form-msg.type';
import { GVDirective } from '../../core/directive/gv.directive';

@Component({
  selector: 'gv-error-message',
  templateUrl: './error-message.html'
})
export class GVErrorMessageComponent implements OnInit, OnDestroy {
  @Input() name: string;
  @Input() control: AbstractControl;

  private msgGroup: GVDirective;
  private sub: Subscription;
  private msgs: FormMessage;
  private defaultMsgs: FormMessage;

  parent: ControlContainer;
  msg: string;

	constructor(
		@Optional() @Host() @SkipSelf() msgGroup: GVDirective,
		@Optional() @Host() @SkipSelf() parent: ControlContainer,
    @Inject(GV_ERROR_MESSAGES) defaultMessages: ErrorMessages
	) {
    this.defaultMsgs = defaultMessages;
		this.parent = parent;
		this.msgGroup = msgGroup;
	}

	ngOnInit() {
		if(!this.name && !this.control) {
			return;
		}

		this.initMsgs();
		this.initControl();
		this.initControlStatusSub();
	}

	ngOnDestroy() {
		this.resetSubscription();
	}

	private initControl() {
		this.control = this.control || (this.parent.control && this.parent.control.get(this.name)) || this.parent.control;

		if(this.control.status === 'INVALID') {
			this.processErrors();
		}
	}

	private initControlStatusSub() {
		this.sub = this.control.statusChanges.subscribe((status: FormControlStatus) => {
			if(status === 'INVALID') {
				this.processErrors();
				return;
			}

			this.setMessage();
		});
	}

	private getMsg(error: string) {
		return this.msgs[error] || this.defaultMsgs[error];
	}

	private processErrors() {
		if(!this.control.errors) {
			return;
		}

		const errors: string[] = Object.keys(this.control.errors);
		const error: string = errors[errors.length - 1];
    const data = this.control.errors[error];
    let msg: string = this.getMsg(error);
    msg = this.applyInterpolation(msg, data);
		this.setMessage(msg);
	}

  private applyInterpolation(msg: string, data: any): string {
    if(data) {
      const keys = Object.keys(data);
      let result = msg;
      keys.forEach(key => result = result.replace(`{{${key}}}`, data[key]));
      return result;
    }

    return msg;
  }

	private setMessage(msg: string = '') {
		this.msg = msg;
	}

	private initMsgs() {
		const controlMsgs = this.msgGroup ? this.msgGroup.formMsgGroup[this.name] : {};
		this.msgs = controlMsgs || {};
	}

	private resetSubscription() {
		if(!this.sub) {
			return;
		}

		this.sub.unsubscribe();
	}
}
