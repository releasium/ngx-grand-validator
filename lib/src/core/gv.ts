import { AsyncValidatorFn, FormGroup, ValidatorFn } from '@angular/forms';

import { GVCore } from './gv-core';
import { GVErrMessage } from '../validators/gv-err-message';
import { GVDefaultValidators } from '../validators/gv-default-validators';

export class GV {
  static control() {
    return GV.addControl();
  }

  static group(modelClass: Object) {
    return GV.addGroup(modelClass);
  }

  static required(msg?: string): Function {
    return GV.addControl(GVDefaultValidators.required(), {
      validator: 'required',
      text: msg
    });
  }

  static addGroup(modelClass: Object) {
    return function(target: any, propertyKey: string) {
      const form: GVCore = target.uiForm || new GVCore();
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

  static addControl(validator?: ValidatorFn, msg: GVErrMessage|null = null, asyncValidator?: AsyncValidatorFn) {
    return function(target: any, propertyKey: string) {
      const form: GVCore = target.uiForm || new GVCore();

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
      const form: GVCore = target.uiForm || new GVCore();
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

export class GVModel {
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

  static getUiForm(): GVCore {
    const validation = Reflect.getOwnPropertyDescriptor(this, 'validation');
    return validation && validation.value;
  }
}
