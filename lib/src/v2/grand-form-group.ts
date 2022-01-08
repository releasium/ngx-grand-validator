import { AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';

import { GrandValidatorMessage } from '../validators/message';
import { GrandValidator } from '../validators/grand-validator';

export class GrandValidation {
  static control() {
    return GrandValidation.addControl();
  }

  static group(modelClass: Object) {
    return GrandValidation.addGroup(modelClass);
  }

  static required(msg?: string): Function {
    return GrandValidation.addControl(GrandValidator.required(), {
      validator: 'required',
      text: msg
    });
  }

  static addGroup(modelClass: Object) {
    return function(target: any, propertyKey: string) {
      const form: GrandValidatorCoreForm = target.uiForm || new GrandValidatorCoreForm();
      form.addGroup(propertyKey, modelClass);

      if(!target.uiForm) {
        Reflect.defineProperty(target.constructor, 'validation', {
          value: form,
          writable: true
        });
        target.grandValidationFrom = form;
      }
      return {
        writable: true
      };
    };
  }

  static addControl(validator?: ValidatorFn, msg: GrandValidatorMessage|null = null, asyncValidator?: AsyncValidatorFn) {
    return function(target: any, propertyKey: string) {
      console.log({
        target
      });
      const form: GrandValidatorCoreForm = target.uiForm || new GrandValidatorCoreForm();

      const control = form.addControl(propertyKey, target[propertyKey]);

      if(validator) {
        form.addValidator(control, validator, msg);
      }

      if(asyncValidator) {
        form.addAsyncValidator(control, asyncValidator, msg);
      }

      if(!target.uiForm) {
        Reflect.defineProperty(target.constructor, 'validation', {
          value: form,
          writable: true
        });
        target.uiForm = form;
      }
      return {
        writable: true
      };
    };
  }

  static addArray(modelClasses?: Object, quantityModels?: number) {
    return function(target: any, propertyKey: string) {
      const form: GrandValidatorCoreForm = target.uiForm || new GrandValidatorCoreForm();
      const arrayClasses = [];

      if(quantityModels) {
        for (let i = 0; i < quantityModels; i++) {
          arrayClasses.push(modelClasses);
        }
      }

      form.addArray(propertyKey, arrayClasses);

      if(!target.uiForm) {
        Reflect.defineProperty(target.constructor, 'validation', {
          value: form,
          writable: true
        });
        target.uiForm = form;
      }
      return {
        writable: true
      };
    };
  }
}

export class GrandValidatonForm {
  validation = null;

  static createUIForm(): FormGroup {
    const uiForm = this.getUiForm();
    return uiForm.createUIForm();
  }

  static genUIMsg() {
    const uiForm = this.getUiForm();
    return uiForm.generateErrorMessages();
  }

  static showUIErrors() {
    const uiForm = this.getUiForm();
    return uiForm.showUIErrors();
  }

  static getUiForm(): GrandValidatorCoreForm {
    const validation = Reflect.getOwnPropertyDescriptor(this, 'validation');
    return validation && validation.value;
  }
}

export class GrandValidatorCoreForm {
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

  addValidator(control: FormControl|any, validator: ValidatorFn, msg: GrandValidatorMessage|null) {
    control.validators.push(validator);
    if(!msg || !msg.text) {
      return;
    }

    control.msg[msg.validator] = msg.text;
  }

  addAsyncValidator(control: FormControl|any, validator: AsyncValidatorFn, msg: GrandValidatorMessage|null) {
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
