import { AsyncValidatorFn, UntypedFormGroup, ValidatorFn } from '@angular/forms';

import { GVCore } from './gv-core';
import { GVErrMessage } from '../validators/gv-err-message';
import { GVDefaultValidators } from '../validators/gv-default-validators';
import { FormMessage } from '../components/error-message/form-msg.type';

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
// TODO fix validators duplications
  static cardNumber(msg?: string): Function {
    return GV.addControl(GVDefaultValidators.cardNumber(), {
      validator: 'card',
      text: msg
    });
  }

  static minLength(value: number, msg?: string): Function {
    return GV.addControl(GVDefaultValidators.minLength(value), {
      validator: 'minlength',
      text: msg
    });
  }

  static maxLength(value: number, msg?: string): Function {
    return GV.addControl(GVDefaultValidators.maxLength(value), {
      validator: 'maxlength',
      text: msg
    });
  }

  static exactLength(value: number | string, msg?: string): Function {
    return GV.addControl(GVDefaultValidators.exactLength(value), {
      validator: 'exactLength',
      text: msg
    });
  }

  static min(value: number | string, msg?: string, ignoreValues?: number[]): Function {
    return GV.addControl(GVDefaultValidators.min(+value), {
      validator: 'min',
      text: msg
    });
  }

  static max(value: number | string, msg?: string): Function {
    return GV.addControl(GVDefaultValidators.max(+value), {
      validator: 'max',
      text: msg
    });
  }

  static digit(msg?: string): Function {
    return GV.addControl(GVDefaultValidators.digit(), {
      validator: 'digit',
      text: msg
    });
  }

  static email(msg?: string): Function {
    return GV.addControl(GVDefaultValidators.email(), {
      validator: 'email',
      text: msg
    });
  }

  static integer(msg?: string): Function {
    return GV.addControl(GVDefaultValidators.integer(), {
      validator: 'integer',
      text: msg
    });
  }

  static pattern(value: RegExp, msg?: string): Function {
    return GV.addControl(GVDefaultValidators.pattern(value), {
      validator: 'pattern',
      text: msg
    });
  }

  static equals(propName: string, msg?: string): Function {
    return GV.addControl(GVDefaultValidators.equals(propName), {
      validator: 'equals',
      text: msg
    });
  }

  static alphanumeric(params: {whiteSpace: boolean} = {whiteSpace: false}, msg?: string): Function {
    if (params.whiteSpace) {
      return GV.addControl(GVDefaultValidators.alphanumeric(params), {
        validator: 'alphanumericWithSpaces',
        text: msg
      });
    }

    return GV.addControl(GVDefaultValidators.alphanumeric(params), {
      validator: 'alphanumeric',
      text: msg
    });
  }

  static addGroup(modelClass: Object): Function {
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

  static addControl(validator?: ValidatorFn, msg: GVErrMessage|null = null, asyncValidator?: AsyncValidatorFn): Function {
    return (target: any, propertyKey: string) => {
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

  static addArray(modelClasses?: Object, quantityModels?: number): Function {
    return (target: any, propertyKey: string) => {
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

interface IGVModel {
  validation: string;
}

export interface Type<T> {
  new (...args: any[]): T;
}

/* static interface declaration */
export interface IGVModelStatic<T> extends Type<Comparable<T>> {
  createForm(): UntypedFormGroup;
  genUIMsg(): FormMessage;
  showUIErrors(): void;
  getUiForm(): GVCore;
}

/* interface declaration */
export interface Comparable<T> {
  validation: null;
}

/* class decorator */
export function staticImplements<T>() {
  return (constructor: T) => {}
}

@staticImplements<IGVModelStatic<GVModel>>()  /* this statement implements both normal interface & static interface */
export class GVModel {
  validation = null;

  static createForm(): UntypedFormGroup {
    const uiForm = this.getUiForm();
    return uiForm.createForm();
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
