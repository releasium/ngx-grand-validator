import { Component, Host, Inject, Input, OnDestroy, OnInit, Optional, SkipSelf } from '@angular/core';
import { AbstractControl, ControlContainer } from '@angular/forms';

import { Subscription } from 'rxjs';
import { ErrorMessages, GV_ERROR_MESSAGES } from './default-msgs';
import { IFormMsg } from './form-msg.type';
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
  private msgs: IFormMsg;
  private defaultMsgs: { [key: string]: string; };

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
		this.sub = this.control.statusChanges.subscribe((status: any) => {
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
		const msg: string = this.getMsg(error);

		this.setMessage(msg);
	}

	private setMessage(errorMessage: string = '') {
		this.msg = errorMessage;
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
