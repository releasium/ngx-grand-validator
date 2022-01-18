import { AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { GVErrMessage } from '../validators/gv-err-message';

export class GVCore {
  private form!: FormGroup;

  reflectFormControls: { [key: string]: any } = {};
  reflectFormGroups: { [key: string]: any } = {};
  reflectFormArrays: { [key: string]: any } = {};

  generateErrorMessages() {
    const message: { [key: string]: Object } = {};

    for(const name in this.reflectFormControls) {
      const controlMessage: { [key: string]: Object } = message[name] = {};
      const control = this.reflectFormControls[name];

      for(const errorName in control.msg) {
        controlMessage[errorName] = control.msg[errorName];
      }
    }

    for(const name in this.reflectFormGroups) {
      const groupClass = this.reflectFormGroups[name];
      const modelGroup = new groupClass();
      message[name] = modelGroup.uiForm.genUIMsg();
    }

    for(const name in this.reflectFormArrays) {
      const modelArrayClasses = this.reflectFormArrays[name];

      modelArrayClasses.forEach((modelArrayClass: any) => {
        const modelArray = new modelArrayClass({});
        message[name] = modelArray.uiForm.genUIMsg();
      });
    }

    return message;
  }

  createUIForm(): FormGroup {
    const builder = new FormBuilder();
    const controlsConfig: { [key: string]: Object } = {};

    for(const name in this.reflectFormControls) {
      const control = this.reflectFormControls[name];
      controlsConfig[name] = [control.value, control.validators, control.asyncValidators];
    }

    for(const name in this.reflectFormGroups) {
      const modelGroupClass = this.reflectFormGroups[name];
      const modelGroup = new modelGroupClass();
      controlsConfig[name] = modelGroup.uiForm.createUIForm();
    }

    for(const name in this.reflectFormArrays) {
      const modelArrayClasses = this.reflectFormArrays[name];
      let formArrayValidators: ValidatorFn[] = [];

      if(this.reflectFormControls[name]) {
        formArrayValidators = this.reflectFormControls[name].validators;
      }

      const formArrayClasses: FormArray = new FormArray([], formArrayValidators);

      modelArrayClasses.forEach((modelArrayClass: any) => {
        const modelArray = new modelArrayClass({});
        const group: FormGroup = modelArray.uiForm.createUIForm();
        formArrayClasses.push(group);
      });

      controlsConfig[name] = formArrayClasses;
    }
    this.form = builder.group(controlsConfig);

    return this.form;
  }

  addControl(name: string, value: Object) {
    return this.reflectFormControls[name] = this.reflectFormControls[name] || {
      value: value,
      validators: [],
      asyncValidators: [],
      msg: {}
    };
  }

  addGroup(name: string, modelGroupClass: Object) {
    this.reflectFormGroups[name] = modelGroupClass;
  }

  addArray(name: string, modelArrayClasses: Object) {
    this.reflectFormArrays[name] = modelArrayClasses;
  }

  addValidator(control: FormControl|any, validator: ValidatorFn, msg: GVErrMessage|null) {
    control.validators.push(validator);
    if(!msg || !msg.text) {
      return;
    }

    control.msg[msg.validator] = msg.text;
  }

  addAsyncValidator(control: FormControl|any, validator: AsyncValidatorFn, msg: GVErrMessage|null) {
    control.asyncValidators.push(validator);
    if(!msg || !msg.text || !msg.asyncValidator) {
      return;
    }

    control.msg[msg.asyncValidator] = msg.text;
  }

  showUIErrors() {
    for(const group in this.reflectFormGroups) {
      this.reflectFormGroups[group].prototype.uiForm.showUIErrors();
    }
    for(const control in this.form.controls) {
      this.form.controls[control].markAsTouched();
    }
  }
}
